/**
 * Script to convert pipeline XML file into Graphviz dot file.
 * The generated output dot file follows the representation in:
 * test/dot_layout/pl1_plaintext_lloc_bottom.dot
 */
var fs = require('fs'),
	path = require('path'),
	XmlStream = require('xml-stream');

/**
 * Async function to convert from pipeline XML to dot string buffer.
 * Call-back function cb should have one parameter to receive the conversion.
 */
function convert_pl_xml(filename, cb) {
	var fname = path.basename(filename),
		d_str = 'digraph ' + fname.substring(0, fname.lastIndexOf('.')) + ' {\node [shape=plaintext];',
		d_str_es = '//Edges \n'; //Edges string buffer

	// Create a file stream and pass it to XmlStream
	var stream = fs.createReadStream(path.join(__dirname, filename)),
		xml = new XmlStream(stream);


	xml.collect('branch');
	xml.collect('node');
	xml.collect('segment');

	var curr_bName = '',
		seg_cnt = 0;
	xml.on('error', function(err) {
		console.log("...Error in stream: "+err);
		cb("Error Occurred"+err);
	});
	xml.on('startElement: branch', function (item) {
		console.log("...... startElement: branch");
		curr_bName = item['$']['basename'];
		seg_cnt = 0;
	});
	xml.on('startElement: segment', function (item) {
		console.log("...... startElement: segment");
		seg_cnt = seg_cnt + 1;
	});
	xml.on('updateElement: node', function (item) {
		console.log("...... updateElement: node");
		console.log("......>>> item: " + JSON.stringify(item));
		var nLabel = item.$.name,
			nTxt = ' ';
		if (item.hasOwnProperty('start-node')) {
			nTxt = ' image="../../../icons/pipeline_start_node.gif"];';
		} else if (item.hasOwnProperty('end-node')) {
			nTxt = ' image="../../../icons/pipeline_end_node.gif"];';
		} else if (item.hasOwnProperty('interaction-node')) {
			nTxt = ' image="../../../icons/pipeline_interaction_node.gif"];';
		} else if (item.hasOwnProperty('loop-node')) {
			nTxt = ' image="../../../icons/pipeline_loop_node.gif"];';
		} else if (item.hasOwnProperty('jump-node')) {
			nTxt = ' image="../../../icons/pipeline_jump_node.gif"];';
		} else if (item.hasOwnProperty('pipelet-node')) {
			nTxt = ' image="../../../icons/pipeline_pipelet_node.gif"];';
		} else if (item.hasOwnProperty('join-node')) {
			nTxt = ' image="../../../icons/pipeline_join_node.gif"];';
		} else if (item.hasOwnProperty('decision-node')) {
			nTxt = ' image="../../../icons/pipeline_decision_node.gif"];';
		}
		d_str += "\n" + curr_bName + "." + seg_cnt + nTxt;
		console.log("........ d_str: " + d_str);
	});
	xml.on('end', function (data) {
		console.log("... d_str: " + d_str);
		cb(d_str + '\n' + d_str_es + '\n}\n');
	});
}

exports.convert_pl_xml = convert_pl_xml;
