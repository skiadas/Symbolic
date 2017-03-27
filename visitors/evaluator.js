/*
 * Evaluation visitor for Symbolic Expressions
 */

(function(define) {
define(function(require, exports, module) {
   var Evaluator, ExpressionVisitor, Symbolic;

   ExpressionVisitor = require('./expressionVisitor');
   Symbolic = require('../symbolic');

   Evaluator = {
      new: function(values) {
         var obj;

         if (typeof values === 'undefined') { values = {}; }

         obj = Object.create(Evaluator.prototype);
         obj._values = values;

         return obj;
      }
   };

   Evaluator.prototype = Object.create(ExpressionVisitor.prototype);

   /**
    * Get or set the evaluator's `values` argument. This is an object to be used
    * for substitution. This function takes four forms:
    *
    * - No arguments: Returns the object of values.
    * - One string argument: Returns the value corresponding to that specific string.
    * - One object argument: Sets the values specified by this object.
    * - Two arguments: Sets the value indicated by the first argument string to equal
    *   the second argument.
    *
    * The values can be anything detected by `Symbolic.fromValue`.
    */
   Evaluator.prototype.values = function(id, value) {
      var key;

      if (arguments.length === 0) {
         return this._values;
      } else if (arguments.length === 1) {
         if (typeof id === 'string') {
            return this._values[id];
         }
         // Set values based on the object
         for (key in id) {
            if (id.hasOwnProperty(key)) {
               this._values[key] = Symbolic.fromValue(id[key]);
            }
         }
      } else {
         this._values[id] = Symbolic.fromValue(value);
      }

      // Function used as a setter. Allow chaining.
      return this;
   };

   Evaluator.prototype.visitNumber = function(expr) {
      return expr;
   };

   Evaluator.prototype.visitVariable = function(expr) {
      var variableValue;

      variableValue = this.values(expr.variable);
      if (typeof variableValue === 'undefined') {
         // No substitution occuring
         return expr;
      }

      return variableValue;
   };

   Evaluator.prototype.visitBinOp = function(expr) {
      var expr1, expr2;

      expr1 = this.visit(expr.operand1);
      expr2 = this.visit(expr.operand2);

      if (expr1.isNumber() && expr2.isNumber()) {
         return Symbolic.number(doOp(expr.operator, expr1.number, expr2.number));
      }

      if (expr1 === expr.operand1 &&
          expr2 === expr.operand2) { return expr; }

      return Symbolic.binOp(expr.operator, expr1, expr2);
   };

   Evaluator.prototype.visitParens = function(expr) {
      var exprEvaluated;

      exprEvaluated = this.visit(expr.expr);

      if (exprEvaluated === expr) { return expr; }

      return exprEvaluated;
   };

   Evaluator.prototype.visitFunction = function(expr) {
      var argumentValue;

      argumentValue = this.visit(expr.arg);

      if (argumentValue === expr.arg) { return expr; }

      if (!argumentValue.isNumber()) {
         return Symbolic.func(expr.name, argumentValue);
      }

      return Symbolic.number(
         doFunctionCall(expr.name, argumentValue.number)
      );
   };

   // Dispatches on arithmetic operator
   function doOp(op, v1, v2) {
      switch (op) {
      case '+': return v1 + v2;
      case '-': return v1 - v2;
      case '*': return v1 * v2;
      case '/': return v1 / v2;
      case '^': return Math.pow(v1, v2);
      default: throw new Error('Unknown operator: ' + op);
      }
   }

   // Dispatches on function calls
   function doFunctionCall(name, val) {
      switch (name) {
      case 'sin': return Math.sin(val);
      case 'cos': return Math.cos(val);
      case 'tan': return Math.tan(val);
      case 'sec': return 1 / Math.cos(val);
      case 'exp': return Math.exp(val);
      case 'ln': return Math.log2(val);
      default: throw new Error('Unknown function: ' + name);
      }
   }

   return Evaluator;
});
}(typeof module === 'object' && typeof define !== 'function' ? function(factory) {
   module.exports = factory(require, exports, module);
} : define));
