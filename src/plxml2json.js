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
	this.segCntInBranch = 0;
	this.segNesting = [];
	this.lBranchName = '';
	this.xform._transform = function (data, encoding, done) {
		//console.log("... transform called");
		console.log("...segNesting depth: " + self.segNesting.length);
		var opObj = {
			'path': self.lBranchName + "." + self.segNesting.join('.') + self.segCntInBranch
		};
		this.push(opObj);
	};
	this.ipStream = fs.createReadStream(filename);
	this.xmlStream = new XmlStream(this.ipStream);
	//Read the required nodes & input to transform stream
	this.xmlStream.on('startElement: branch', function (el) {
		self.lBranchName = el.$.basename;
	});
	this.xmlStream.on('startElement: segment', function (el) {
		self.xform.write(JSON.stringify(el));
		self.segCntInBranch++;
	});
	this.xmlStream.on('endElement: segment', function (el) {
		self.segCntInBranch--;
	});
	this.xmlStream.on('end', function () {
		console.log("...segment count: " + self.segCntInBranch);
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
var opStream = fs.createWriteStream('./output.dot');
plXform.xform.pipe(opStream);
