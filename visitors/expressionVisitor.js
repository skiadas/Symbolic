/*
 * visitor.js
 */
(function(define) {
define(function(require, exports, module) {
   var ExpressionVisitor;

   ExpressionVisitor = {
      new: function() {
         throw new Error('Should not call the abstractx class ExpressionVisitor directly.');
      }
   };

   ExpressionVisitor.prototype = {
      visit: function(expr) {
         return expr.accept(this);
      },
      visitNumber: function(expr) {
         throw new Error('Subclasses of ExpressionVisitor must implement `visitNumber`');
      },
      visitVariable: function(expr) {
         throw new Error('Subclasses of ExpressionVisitor must implement `visitVariable`');
      },
      visitBinOp: function(expr) {
         throw new Error('Subclasses of ExpressionVisitor must implement `visitBinOp`');
      },
      visitParens: function(expr) {
         throw new Error('Subclasses of ExpressionVisitor must implement `visitParens`');
      },
      visitFunction: function(expr) {
         throw new Error('Subclasses of ExpressionVisitor must implement `visitFunction`');
      }
   };

   return ExpressionVisitor;
});
}(typeof module === 'object' && typeof define !== 'function' ? function(factory) {
   module.exports = factory(require, exports, module);
} : define));
