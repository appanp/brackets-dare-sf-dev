var fs = require('fs'),
	stream = require('stream'),
	XmlStream = require('xml-stream');

function PlineXformer(filename, options) {
	options = options || {};
	//Expects objects in & objects out
	options.objectMode = true;
	var self = this;

	//Transformer & a few state variables
	this.xform = new stream.Transform(options);
	this.segNestedDepth = 0;
	this.segNestedPath = [];
	this.currBrName = '';
	this.graph = {};
	this.graph.nodes = [];
	this.plName = '';
	this.brFirst = true;
	this.simTrans = false; //Flag for having seen a simple-transition
	this.prevDep = 0;

	//Actual transformer
	this.xform._transform = function (data, encoding, done) {
		//console.log("... transform called");
	};
	this.ipStream = fs.createReadStream(filename);
	this.xmlStream = new XmlStream(this.ipStream);

	//Read the required nodes & input to transform stream
	this.xmlStream.on('startElement: pipeline', function (el) {
		self.graph.group = el.$.group;
		self.graph.type = el.$.type;
	});

	this.xmlStream.on('startElement: branch', function (el) {
		if (self.brFirst) {
			self.plName = el.$.basename;
			self.brFirst = false;
		}
		self.currBrName = el.$.basename;
		self.segNestedDepth++;
		self.prevCnt = 0;
		self.segNestedPath.push(self.currBrName);
		self.lastNode = 'branch';
		console.log("Brh: " + self.segNestedPath.join('.'));
	});
	this.xmlStream.on('startElement: segment', function (el) {
		if (self.segNestedDepth == (self.prevDep + 1)) {
			self.segNestedPath.push(1);
		} else {
			//var oldval = self.segNestedPath.pop();
			self.segNestedPath.push(self.prevCnt + 1);
		}
		self.segNestedDepth++;
		self.lastNode = 'segment';
		console.log("Seg: " + self.segNestedPath.join('.'));
	});
	this.xmlStream.on('endElement: node', function (item) {
		var opObj = {};
		console.log("... Node found");
		if (self.lastNode == 'segment') {
			opObj.id = self.segNestedPath.join('.');
			self.nodeCnt = 0;
		} else {
			self.nodeCnt++;
			opObj.id = self.segNestedPath.join('.') + '.' + self.nodeCnt;
		}
		if (self.simTrans) {
			self.simTrans = false;
			var lNode = self.graph.nodes.pop();
			if (lNode.og_links) {
				lNode.og_links.push(opObj.id);
			} else {
				lNode.op_links = [];
				lNode.og_links.push(opObj.id);
			}
		}
		if (item.hasOwnProperty('start-node')) {
			opObj.type = 'start-node';
			opObj.name = item['start-node'].$.name;
		} else if (item.hasOwnProperty('end-node')) {
			opObj.type = 'end-node';
		} else if (item.hasOwnProperty('interaction-node')) {
			opObj.type = 'interaction-node';
		} else if (item.hasOwnProperty('loop-node')) {
			opObj.type = 'loop-node';
		} else if (item.hasOwnProperty('jump-node')) {
			opObj.type = 'jump-node';
		} else if (item.hasOwnProperty('pipelet-node')) {
			opObj.type = 'pipelet-node';
			opObj.name = item['pipelet-node'].$['pipelet-name'];
		} else if (item.hasOwnProperty('join-node')) {
			opObj.type = 'join-node';
		} else if (item.hasOwnProperty('decision-node')) {
			opObj.type = 'decision-node';
			opObj.name = item['decision-node'].$['condition-key'];
		} else if (item.hasOwnProperty('text-node')) {
			opObj.type = 'text-node';
		}
		self.graph.nodes.push(opObj);
		self.lastNode = 'node';
	});
	this.xmlStream.on('endElement: segment', function (el) {
		self.prevCnt = self.segNestedPath.pop();
		self.prevDep = self.segNestedDepth--;
	});
	this.xmlStream.on('endElement: branch', function (el) {
		self.prevCnt = 0;
		self.prevDep = self.segNestedDepth--;
		self.segNestedPath.pop();
	});
	this.xmlStream.on('endElement: simple-transition', function (el) {
		self.simTrans = true;
	});
	this.xmlStream.on('end', function () {
		console.log("... Counters: " + self.segNestedDepth + ", " + self.segNestedPath.length);
		console.log("JSON Graph:");
		console.log(JSON.stringify(self.graph));
	});
}
module.exports = function (options) {
	return new PlineXformer(options);
};

/* START: Main, Test the transformer */
//var ipFile = require('path').join(__dirname, process.argv[2]);
var ipFile = process.argv[2];
//var ipFile = 'test/pl_xml/unit/OnRequest_1sub_1start_1end.xml';
var plXform = new PlineXformer(ipFile);
//var opStream = fs.createWriteStream('./output.dot');
//plXform.xform.pipe(opStream);
