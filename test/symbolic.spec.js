var Symbolic = require('..');
var chai = require('chai');
var expect = chai.expect;

describe('Symbolic Expressions', function() {
   it('Have subclasses for standard operations', function() {
      [
         'Number', 'Variable', 'BinOp', 'Function'
      ].forEach(function(key) {
         expect(Symbolic).to.have.property(key);
      });
   });
});
describe('Number expressions', function() {
   it('are built via the Symbolic.Number.new constructor', function() {
      var n = Symbolic.Number.new(12);
      expect(Symbolic.Number.prototype.isPrototypeOf(n)).to.equal(true);
      expect(Symbolic.prototype.isPrototypeOf(n)).to.equal(true);
   });
   it('have a number property', function() {
      var n = Math.random();
      var numExpr = Symbolic.Number.new(n);
      expect(numExpr).to.have.property('number');
      expect(numExpr.number).to.equal(n);

   });
});
