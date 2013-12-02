;(function(insteon, $, undefined) {

	insteon.EZSrve = function(){
		this.callbacks = {};
		this.pendingResponse = "";
		this.cmdQueue = [];
		this.currentCommand = null;
	};
	
	insteon.EZSrve.prototype.connect = function(ip,port,cb){
		this.callbacks.connected = cb;
		var self = this;
		chrome.socket.create('tcp', {}, function(createInfo){
			self.socketId = createInfo.socketId;
			chrome.socket.connect(createInfo.socketId,ip,port,self.onConnected.bind(self));
		});
	};
	
	insteon.EZSrve.prototype.onConnected = function(){
		console.log("connected!");
		setInterval(this.periodicallyRead.bind(this), 500);
		if(this.callbacks.connected){
			this.callbacks.connected();
		}
	};
	
	insteon.EZSrve.prototype.periodicallyRead = function(){
		chrome.socket.read(this.socketId, this.onDataRead.bind(this));
	};

	insteon.EZSrve.prototype.parseResponse = function(data){
		this.pendingResponse += data;
		var start = this.pendingResponse.match(/<Response/);
		while(start != null){
			this.pendingResponse = this.pendingResponse.substring(start.index,this.pendingResponse.length);
			var end = this.pendingResponse.match(/<\/Response>/);
			if(end == null){
				break;
			} else {
				var response = this.pendingResponse.substring(0,end.index+11);
				this.pendingResponse = this.pendingResponse.substring(end.index+11,this.pendingResponse.length);
				var ret = {raw:response};
				var responseHeaderStart = response.match(/ /);
				var responseHeaderEnd = response.match(/>/);
				var parts = response.substring(responseHeaderStart.index,responseHeaderEnd.index).split(/\s+/);
				for(var i = 0; i < parts.length; ++i){
					var subparts = parts[i].split(/=/);
					if(subparts.length == 2)
						ret[subparts[0]]=subparts[1].substring(1,subparts[1].length-1);
				}
				
				if(ret.Status != undefined){
					if(this.currentCommand != null && this.currentCommand.callback){
						this.currentCommand.callback(ret);
					}
					if(this.cmdQueue.length){
						this.currentCommand = this.cmdQueue.shift();
						this.send(this.currentCommand.string);
					}
				} else {
					if(ret.Name == "PLMRaw" && this.callbacks.rawCallback){
						var bytes = response.match(/<Byte\d+="0x[0-9A-F]{2}"\/>/g);
						if(bytes != null){
							var plmRaw = [];
							for(var i = 0; i < bytes.length; ++i){
								plmRaw.push(bytes[i].match(/0x[0-9A-F]{2}/)[0]);
							}
							ret.plmRaw = insteon.decodePLM(plmRaw);
						}
						this.callbacks.rawCallback(ret);
					}
				}
			}
		}
	};
	
	insteon.EZSrve.prototype.onDataRead = function(readInfo){
		if(readInfo.resultCode > 0){
			var reader = new FileReader();
			var self = this;
			reader.onload = function(e){
				self.parseResponse(e.target.result);
			};
			var blob = new Blob([readInfo.data], { type: 'application/octet-stream' });
			reader.readAsText(blob);
		}
	};
	
	insteon.EZSrve.prototype.send = function(data){
		var blob = new Blob([data]);
		var reader = new FileReader();
		var id = this.socketId;
		reader.onload = function(e){
			chrome.socket.write(id,e.target.result,function(){});
		};
		reader.readAsArrayBuffer(blob);
	};
	
	insteon.EZSrve.prototype.sendCommand = function(cmd,cb){
		var c = {command:cmd, callback:cb};
		c.string = '<Command';
		for (var k in cmd){
			c.string += ' '+k+'="'+cmd[k]+'"';
		}
		c.string += ' />';
		if(this.currentCommand == null){
			this.currentCommand = c;
			this.send(c.string);
		} else
			this.cmdQueue.push(c);
			
	};
	
	insteon.EZSrve.prototype.setRawCallback = function(cmdcb, rawcb){
		this.callbacks.rawCallback = rawcb;
		if(rawcb != undefined)
			this.sendCommand({Name:"PLMRaw",Mode:"On"},cmdcb);
		else
			this.sendCommand({Name:"PLMRaw",Mode:"Off"},cmdcb);
	};
	
	insteon.EZSrve.prototype.getDeviceList = function(cb){
		this.sendCommand({Name:"Read",File:"Devices"},function(ret){
			var doc = $.parseXML(ret.raw);
			ret.devices = $("Devices",doc)[0];
			cb(ret);
		});
	};
	
	
})(window.insteon = window.insteon || {}, jQuery);
