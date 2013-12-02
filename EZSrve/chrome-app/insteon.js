;(function(insteon, $, undefined) {

	insteon.toAddress = function(high,mid,low){
		var ret = "";
		
		if(high.length == 2)
			ret += high;
		else
			ret += high.substring(2,4);
		
		ret += ".";
		
		if(mid.length == 2)
			ret += mid;
		else
			ret += mid.substring(2,4);

		ret += ".";
		
		if(low.length == 2)
			ret += low;
		else
			ret += low.substring(2,4);

		return ret;
	};
	
	insteon.decodePLM = function(data){
		var ret = {};
		if(data[0] == "0x50")
			ret.pmlCommand="Standard Message Received";
		else if(data[0] == "0x51")
			ret.pmlCommand="Extended Message Received";
		else
			ret.pmlCommand="(not decoded)";
		
		ret.from = insteon.toAddress(data[1],data[2],data[3]);
		ret.to = insteon.toAddress(data[4],data[5],data[6]);
		ret.flags = data[7];
		ret.command = [data[8],data[9]];

		if (data.length == 24)
			ret.userData = data.slice(10,24);
		
		return ret;
	};
	
})(window.insteon = window.insteon || {}, jQuery);
