window.onload=function(){
	console.log("main");
	
	ezsrve = new insteon.EZSrve();
	
	var rawCallback = function(data){
		console.log(data);
		if(data.plmRaw){
			var $debug = $("#debug");
			$debug.html($debug.html()+"<p>"+JSON.stringify(data.plmRaw)+"</p>");
		}
	};
	
	ezsrve.connect("192.168.1.15", 8002, function(){
		ezsrve.getDeviceList(function(ret){
			$("Device",ret.devices).each(function(index){
				console.log(this);
				var $this = $(this);
				var $devices = $("#devices");
				$devices.html($devices.html()+"<p>"+$this.attr("ID")+" "+$this.attr("Name")+"</p>");
			});
		});
		ezsrve.setRawCallback(function(ret){console.log(ret);},rawCallback);
	});
	
};