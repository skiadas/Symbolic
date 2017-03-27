/*
 * String printer
 */

(function(define) {
define(function(require, exports, module) {
   var StringPrinter, ExpressionVisitor, Symbolic;

   ExpressionVisitor = require('./expressionVisitor');
   Symbolic = require('../symbolic');

   StringPrinter = {
      // TODO: Should probably turn this into singleton
      new: function(starForProduct) {
         var obj;

         obj = Object.create(StringPrinter.prototype);
         obj.starForProduct = starForProduct === true;

         return obj;
      }
   };

   StringPrinter.prototype = Object.create(ExpressionVisitor.prototype);

   StringPrinter.prototype.visitNumber = function(expr) {
      return String(expr.number);
   };

   StringPrinter.prototype.visitVariable = function(expr) {
      return expr.variable;
   };

   StringPrinter.prototype.visitBinOp = function(expr) {
      var connection;

      connection = ' ' + expr.operator + ' ';
      if (expr.operator === '*' && !this.starForProduct) {
         connection = ' ';
      }

      return this.visit(expr.operand1) +
             connection +
             this.visit(expr.operand2);
   };

   StringPrinter.prototype.visitParens = function(expr) {
      return '(' + this.visit(expr.expr) + ')';
   };

   StringPrinter.prototype.visitFunction = function(expr) {
      if (Symbolic.Parens.prototype.isPrototypeOf(expr.expr)) {
         return expr.name + this.visit(expr.expr);
      }

      return expr.name + ' ' + this.visit(expr.expr);
   };

   return StringPrinter;
});
}(typeof module === 'object' && typeof define !== 'function' ? function(factory) {
   module.exports = factory(require, exports, module);
} : define));
