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
	this.plName = '';
	this.brFirst = true;
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
		console.log("+++ CMP: " + self.segNestedDepth + "," + self.segNestedPath.join('$'));
		if (self.segNestedDepth == (self.prevDep + 1)) {
			self.segNestedPath.push(self.currBrName);
		} else {
			//console.log("... Popping branch: " + self.segNestedPath.pop());
			self.segNestedPath.push(self.currBrName);
		}
		console.log("----> Branch: " + self.currBrName);
	});
	this.xmlStream.on('startElement: segment', function (el) {
		//self.xform.write(JSON.stringify(el));
		console.log("+++ CMP: " + self.segNestedDepth + "," + self.segNestedPath.join('$'));
		if (self.segNestedDepth == (self.prevDep + 1)) {
			self.segNestedPath.push(1);
		} else {
			//var oldval = self.segNestedPath.pop();
			self.segNestedPath.push(self.prevCnt + 1);
		}
		self.segNestedDepth++;
		console.log("Seg: " + self.segNestedPath.join('.'));
	});
	this.xmlStream.on('endElement: segment', function (el) {
		self.prevCnt = self.segNestedPath.pop();
		console.log("... pop-seg: " + self.prevCnt);
		self.prevDep = self.segNestedDepth--;
	});
	this.xmlStream.on('endElement: branch', function (el) {
		self.prevCnt = 0;
		self.prevDep = self.segNestedDepth--;
		console.log("... pop-br: " + self.segNestedPath.pop());
	});
	this.xmlStream.on('end', function () {
		console.log("segment count: " + self.segNestedDepth);
		console.log("segNestedPath len: " + self.segNestedPath.length);
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
