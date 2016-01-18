/**
 * Mocha unit-test cases for the xml2dot module.
 */
var assert = require('chai').assert,
    plxml2dot = require('../src/pl_xml2dot');

describe("Pipeline XML to Graphviz dot Conversion", function () {
    it("should convert simple 2-nodes pipeline: OnRequest_1sub_1start_1end.xml", function (done) {
        plxml2dot.convert_pl_xml('pl_xml/unit/OnRequest_1sub_1start_1end.xml', function (str) {
            console.log(str);
            done();
        });
    });
    it("should convert simple 3-nodes pipeline: OnSession_1sub_1start_2end.xml", function (done) {
        plxml2dot.convert_pl_xml('pl_xml/unit/OnSession_1sub_1start_2end.xml', function (str) {
            console.log(str);
            done();
        });
    });
    it("should convert pipeline with decision node: Mail_1sub_2start_1dec.xml", function (done) {
        plxml2dot.convert_pl_xml('pl_xml/unit/Mail_1sub_2start_1dec.xml', function (str) {
            console.log(str);
            done();
        });
    });
});
