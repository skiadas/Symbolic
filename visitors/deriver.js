/*
 * Visitor computing derivatives, to be used for Symbolic Expressions
 */

(function(define) {
define(function(require, exports, module) {
   var Deriver, ExpressionVisitor, Symbolic;

   ExpressionVisitor = require('./expressionVisitor');
   Symbolic = require('../symbolic');

   Deriver = {
      // variable: The variable to differentiate (e.g. x)
      new: function(variable) {
         var obj;

         obj = Object.create(Deriver.prototype);
         obj.variable = variable;

         return obj;
      }
   };

   Deriver.prototype = Object.create(ExpressionVisitor.prototype);

   Deriver.prototype.visitNumber = function(expr) {
      return Symbolic.number(0);
   };

   Deriver.prototype.visitVariable = function(expr) {
      return Symbolic.number(expr.variable === this.variable ? 1 : 0);
   };

   Deriver.prototype.visitBinOp = function(expr) {
      switch (expr.operator) {
      case '+':
      case '-': return Symbolic.binOp(expr.operator,
                           this.visit(expr.operand1),
                           this.visit(expr.operand2));
      case '*': return productDerivative.call(this, expr.operand1, expr.operand2);
      case '/': return quotientDerivative.call(this, expr.operand1, expr.operand2);
      case '^': return powerDerivative.call(this, expr.operand1, expr.operand2, expr);
      default: throw new Error('Unknown operator ' + expr.operator);
      }
   };

   Deriver.prototype.visitParens = function(expr) {
      return Symbolic.parens(this.visit(expr.expr));
   };

   // Have to apply chain rule
   Deriver.prototype.visitFunction = function(expr) {
      switch (expr.name) {
      case 'sin': return Symbolic.cos(expr.arg)
                              .times(this.visit(expr.arg));
      case 'cos': return Symbolic.uminus(Symbolic.sin(expr.arg))
                              .times(this.visit(expr.arg));
      case 'tan': return Symbolic.tan(expr.arg)
                           .power(Symbolic.number(2))
                           .times(this.visit(expr.arg));
      case 'exp': return expr.times(this.visit(expr));
      case 'ln': return this.visit(expr).over(expr);
      default: throw new Error('Unknown function: ' + expr.name);
      }
   };

   // HELPER METHODS HERE
   function productDerivative(f, g) {
      return Symbolic.plus(
               this.visit(f).times(g),
               f.times(this.visit(g)));
   }

   function quotientDerivative(num, denom) {
      return Symbolic.over(
               Symbolic.minus(
                  this.visit(num).times(denom),
                  num.times(this.visit(denom))),
               denom.power(Symbolic.number(2)));
   }

   function powerDerivative(base, exponent, expr) {
      if (exponent.isNumber()) {
         return Symbolic.times(
                  exponent,
                  Symbolic.times(
                     base.power(exponent.sub(1)),
                     this.visit(base)));
      }
      // TODO: Special case when base is a number
      // Case of f(x)^g(x)
      // Derivative is f(x)^g(x) * (g(x)*ln(f(x)))'
      return expr.times(this.visit(
               exponent.times(Symbolic.ln(base))));
   }

   return Deriver;
});
}(typeof module === 'object' && typeof define !== 'function' ? function(factory) {
   module.exports = factory(require, exports, module);
} : define));
