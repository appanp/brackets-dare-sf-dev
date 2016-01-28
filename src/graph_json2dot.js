/*jslint node: true */
"use strict";
/**
 * Script to convert from JSON to Graphviz dot file.
 * JSON file is assumed to produced from script plxml2json.js
 */
var fs = require('fs'),
	JSONStream = require('json-stream'),
	JSONStream2 = require('JSONStream'),
	stream = require('stream'),
	util = require('util'),
	ipFile = process.argv[2];

//Transform stream to output dot text file
var dotXform = new stream.Transform({
		objectMode: true
	}),
	type2imgPath = {
		"start-node": "../../../icons/pipeline_start_node.gif",
		"end-node": "../../../icons/pipeline_end_node.gif",
		"interaction-node": "../../../icons/pipeline_interaction_node.gif",
		"decision-node": "../../../icons/pipeline_decision_node.gif",
		"loop-node": "../../../icons/pipeline_loop_node.gif",
		"jump-node": "../../../icons/pipeline_jump_node.gif",
		"call-node": "../../../icons/pipeline_call_node.gif",
		"pipelet-node": "../../../icons/pipeline_pipelet_node.gif",
		"text-node": "../../../icons/pipeline_text_node.gif",
		"join-node": "../../../icons/pipeline_join_node.gif"
	};
dotXform._transform = function (data, encoding, done) {
	//this.push(JSON.stringify(data));
	var temp = '',
		op_data = 'digraph OpGraph {\n';
	op_data += 'node [color=lightblue,style=filled,shape=plaintext,labelloc=b,height=0.3];\n';
	data.nodes.forEach(function (d, i, a) {
		temp = type2imgPath[d.type];
		op_data += '"' + d.id + '"' + ' [label="' + (d.name || '') + '",image="' + temp + '"];\n';
	});

	//Ouput edges
	op_data += "//Edges\n";
	data.nodes.forEach(function (d, i, a) {
		temp = d.id;
		if (d.og_links) {
			d.og_links.forEach(function (l, j, b) {
				op_data += '"' + temp + '" -> "' + l + '"\n';
			});
		}
	});
	op_data += "}\n";
	this.push(op_data);
	done();
};
/*
var jsonStream = new JSONStream();
jsonStream.on('data', function (chunk) {
	dotXform.write(chunk);
});
*/

var jsonStream = JSONStream2.parse();
jsonStream.on('root', function (obj) {
	//dotXform.write(JSON.stringify(obj));
	dotXform.write(obj);
});

/*
function StringifyStream() {
	stream.Transform.call(this);

	this._readableState.objectMode = false;
	this._writableState.objectMode = true;
}
util.inherits(StringifyStream, stream.Transform);
*/
//MAIN: Just open input stream & pipe
var opStream = fs.createWriteStream('./output.dot');
var jsonToStrings = JSONStream2.stringify(false);
//	.pipe(jsonToStrings)
fs.createReadStream(ipFile, {
		encoding: 'utf8'
	})
	.pipe(jsonStream)
	.pipe(dotXform)
	.pipe(opStream);

process.stdout.on('error', process.exit);
