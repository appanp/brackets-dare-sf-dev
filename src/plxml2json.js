/*jslint node: true */
"use strict";
var fs = require('fs'),
	path = require('path'),
	XmlStream = require('xml-stream');

function PlineXformer(filename, options) {
	options = options || {};
	//Expects objects in & objects out
	options.objectMode = true;
	var self = this,
		tempTxt;

	//Transformer & a few state variables
	this.segNestedDepth = 0;
	this.segNestedPath = []; //stack of <branch>.<seg Id>
	this.nodeIdsStck = []; //For keeping track of IDs to identify nodes
	this.currBrName = '';
	this.graph = {};
	this.graph.nodes = [];
	//Used to track node index in graph.nodes
	this.nodeIds = []; //Required for creating simple & inter transition
	this.lastNodeId = 0; //last popped nodeId from nodeIds
	this.plName = '';
	this.brFirst = true;
	this.simTrans = false; //Flag for having seen a simple-transition
	this.prevSegDep = 0;
	//Flag to indicate if in node element
	//Required to handle transactional inter-segment transition
	this.inNode = true;

	//Just to test uniqueness of generated IDs
	this.genNodeIds = {};

	//BEGIN: Helper functions
	this.AddNode = function (el) {
		var opObj = {},
			lNode,
			tempTxt;
		opObj.type = el.$name;
		opObj.id = self.segNestedPath.join('/') + '/' + self.nodeIdsStck[self.nodeIdsStck.length - 1];

		//Handle edge for previous simple-transition
		if (self.simTrans) {
			self.simTrans = false;
			lNode = self.graph.nodes[self.lastNodeId];
			if (lNode.og_links) {
				lNode.og_links.push(opObj.id);
			} else {
				lNode.og_links = [];
				lNode.og_links.push(opObj.id);
			}
		}
		//Create edge for previous intra-segment transition
		if (self.segTrans) {
			self.segTrans = false;
			lNode = self.graph.nodes[self.graph.nodes.length - 1];
			if (lNode.og_links) {
				lNode.og_links.push(opObj.id);
			} else {
				lNode.og_links = [];
				lNode.og_links.push(opObj.id);
			}
		}
		//Push graph.nodes curr id into nodeIds
		self.nodeIds.push(self.graph.nodes.length);
		//Name is optional depending on node-type
		if (opObj.type === 'decision-node') {
			opObj.name = el.$['condition-key'];
		} else if (opObj.type === 'call-node') {
			opObj.name = el.$['start-name-ref'];
		} else if (opObj.type === 'pipelet-node') {
			tempTxt = el.$['pipelet-set-identifier'];
			opObj.name = el.$['pipelet-name'] + '(' + tempTxt + ')';
			//TODO: Add configs field for config-property tags
		} else if (el.$ && el.$.name) {
			opObj.name = el.$.name;
		}
		console.log("..." + opObj.type + ": " + opObj.id);
		//Check for uniqueness of ID & then push
		if (!self.genNodeIds[opObj.id]) {
			self.genNodeIds[opObj.id] = opObj.type;
			self.graph.nodes.push(opObj);
		} else {
			console.log("**** ObjID already found: " + opObj.id + " of type: " + self.genNodeIds[opObj.id]);
		}
	};

	//Function to return the target node ID given current node ID path
	this.getTargetNId = function (segPath, tPath) {
		var temp = '',
			segId = 0,
			tId = '';
		console.log("+++++ segPath: " + segPath + ", tPath: " + tPath);
		if (tPath === "./+1") {
			segId = parseInt(segPath.substring(segPath.lastIndexOf('.') + 1), 10);
			tId = segPath.substring(0, segPath.lastIndexOf('.') + 1) + (segId + 1) + "/1";
		} else if (tPath === "../+1") {
			temp = segPath.substring(0, segPath.lastIndexOf('/'));
			segId = parseInt(temp.substring(temp.lastIndexOf('.') + 1), 10);
			tId = temp.substring(0, temp.lastIndexOf('.') + 1) + (segId + 1) + "/1";
		} else if (tPath === "..") {
			temp = segPath.substring(0, segPath.lastIndexOf('/'));
			tId = temp + "/1";
		} else if (tPath === "./") {
			tId = segPath + "/1";
		} else if (tPath.indexOf("./") === 0) {
			tId = segPath + tPath.substring(tPath.indexOf('/')) + "/1";
		} else if (tPath.indexOf('/') === 0) {
			tId = tPath.substring(1) + "/1";
		}
		return tId;
	};

	// Function returns nodeId of target node from targetPath attribute
	//This handles inter-segment transitions only.
	this.addEdge = function (el) {
		var lNode, tPath, segPath, segId, tId;
		if (!self.inNode)
			lNode = self.graph.nodes[self.lastNodeId];
		else
			lNode = self.graph.nodes[self.graph.nodes.length - 1];
		if (el.$['target-path']) {
			tPath = el.$['target-path'];
			//console.log("... addEdge: " + tPath);
			segPath = lNode.id.substring(0, lNode.id.lastIndexOf('/'));
			tId = self.getTargetNId(segPath, tPath);
			console.log("++++++++ tId returned: " + tId);
			if (lNode.og_links) {
				lNode.og_links.push(tId);
			} else {
				lNode.og_links = [];
				lNode.og_links.push(tId);
			}
		} else {
			self.segTrans = true;
		}
	};
	//END: Helper functions
	tempTxt = path.basename(filename);
	this.opFileName = path.join('temp', tempTxt.substring(0, tempTxt.lastIndexOf('.')) + ".json");
	this.ipStream = fs.createReadStream(filename);
	this.xmlStream = new XmlStream(this.ipStream);

	//Read the required nodes & tranform to JSON object
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
		self.segNestedDepth += 1;
		self.prevSCnt = 0;
		//self.segNestedPath.push(self.currBrName);
		self.lastNode = 'branch';
		console.log("Brh: " + self.segNestedPath.join('/') + '/' + self.currBrName);
	});
	this.xmlStream.on('startElement: segment', function (el) {
		self.segNestedDepth += 1;
		console.log("***** segDep, prevDep: " + self.segNestedDepth + "," + self.prevSegDep);
		self.prevSCnt += 1;
		self.segNestedPath.push(self.currBrName + "." + self.prevSCnt);
		self.lastNode = 'segment';
		self.nodeIdsStck.push(0);
		console.log("Seg: " + self.segNestedPath.join('/'));
	});
	//Handle each node type in a separate handler
	this.xmlStream.on('updateElement: decision-node', function (el) {
		self.AddNode(el);
	});
	this.xmlStream.on('updateElement: start-node', function (el) {
		self.AddNode(el);
	});
	this.xmlStream.on('updateElement: end-node', function (el) {
		self.AddNode(el);
	});
	this.xmlStream.on('updateElement: interaction-node', function (el) {
		self.AddNode(el);
	});
	this.xmlStream.on('updateElement: loop-node', function (el) {
		self.AddNode(el);
	});
	this.xmlStream.on('updateElement: jump-node', function (el) {
		self.AddNode(el);
	});
	this.xmlStream.on('updateElement: call-node', function (el) {
		self.AddNode(el);
	});
	this.xmlStream.on('updateElement: join-node', function (el) {
		self.AddNode(el);
	});
	this.xmlStream.on('updateElement: pipelet-node', function (el) {
		self.AddNode(el);
	});
	this.xmlStream.on('updateElement: text-node', function (el) {
		self.AddNode(el);
	});
	this.xmlStream.on('startElement: node', function (item) {
		//console.log("... Node found");
		console.log("***** segDep, prevDep: " + self.segNestedDepth + "," + self.prevSegDep);
		self.inNode = true;
		self.nodeIdsStck[self.nodeIdsStck.length - 1] += 1;
	});
	this.xmlStream.on('endElement: node', function (el) {
		self.lastNode = 'node';
		self.inNode = false;
		self.lastNodeId = self.nodeIds.pop();
	});
	this.xmlStream.on('endElement: segment', function (el) {
		var temp = '';
		self.prevSegDep = self.segNestedDepth;
		self.segNestedDepth -= 1;
		//self.prevNCnt = 0;
		temp = self.segNestedPath.pop();
		self.currBrName = temp.substring(0, temp.lastIndexOf('.'));
		self.prevSCnt = parseInt(temp.substring(temp.lastIndexOf('.') + 1), 10);
		self.nodeIdsStck.pop();
	});
	this.xmlStream.on('endElement: branch', function (el) {
		if (self.segNestedPath.length > 0) {
			var temp = self.segNestedPath[self.segNestedPath.length - 1];
			self.currBrName = temp.substring(0, temp.lastIndexOf('.'));
		}
		console.log("*** prevSCnt: " + self.prevSCnt);
		self.prevSegDep = 0;
		self.segNestedDepth -= 1;
	});
	this.xmlStream.on('endElement: simple-transition', function (el) {
		self.simTrans = true;
	});
	this.xmlStream.on('endElement: transition', function (el) {
		self.addEdge(el);
	});
	this.xmlStream.on('end', function () {
		console.log("... Counters: " + self.segNestedDepth + ", " + self.segNestedPath.length + ", " + self.nodeIds.length + ", " + self.nodeIdsStck.length);
		console.log("JSON Graph written to file: ");
		console.log("... " + self.opFileName);
		fs.writeFileSync(self.opFileName,
			JSON.stringify(self.graph, null, 2));
	});
}
module.exports = function (options) {
	return new PlineXformer(options);
};

/* START: Main, Test the transformer */
//var ipFile = require('path').join(__dirname, process.argv[2]);
var ipFile = process.argv[2];
var plXform = new PlineXformer(ipFile);
//var opStream = fs.createWriteStream('./output.dot');
//plXform.xform.pipe(opStream);
