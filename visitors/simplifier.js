/*
 * Visitor computing derivatives, to be used for Symbolic Expressions
 */

(function(define) {
define(function(require, exports, module) {
   var Simplifier, ExpressionVisitor, Symbolic, steps;

   ExpressionVisitor = require('./expressionVisitor');
   Symbolic = require('../symbolic');

   /*
    * An array of the various steps that the simplifier applies. The
    * simplifier applies all of these in some order and repeatedly until none of
    * them changes the result.
    *
    * Entries in the array are objects with string `name` for the step
    * and a visitor object `step` with the actual code.
    *
    * Each step must be an instance of `Simplifier.Step`.
    */
   steps = [];

   Simplifier = {
      new: function() {
         var obj;

         obj = Object.create(Simplifier.prototype);

         return obj;
      },
      /**
       * Add a step to the simplifier process, with a given `name`.
       *
       * `methods` must be as described in `Simplifier.Step.new`.
       */
      addStep: function(name, methods) {
         if (typeof this.getStep(name) !== 'undefined') {
            console.log('Step with name ' + name + ' already added');
         } else {
            steps.push({ name: name, step: Simplifier.Step.new(methods) });
         }

         return this;
      },
      /**
       * Return the step with a given `name`, or `undefined` if one is not found.
       */
      getStep: function(name) {
         var i;

         for (i = 0; i < steps.length; i += 1) {
            if (steps[i].name === name) {
               return steps[i].step;
            }
         }

         return undefined;
      }
   };

   Simplifier.prototype = Object.create(ExpressionVisitor.prototype);

   Simplifier.prototype.simplify = function(expr) {
      var oldExpr, newExpr;

      newExpr = expr;
      // Repeat as long as the result of the transformation is different
      // than the start point
      while (oldExpr !== newExpr) {
         oldExpr = newExpr;
         newExpr = this.visit(oldExpr);
      }

      return newExpr;

   };
   Simplifier.prototype.visitNumber = function(expr) {
      return applySteps(expr);
   };
   Simplifier.prototype.visitVariable = function(expr) {
      return applySteps(expr);
   };
   Simplifier.prototype.visitBinOp = function(expr) {
      var simplifiedOperand1, simplifiedOperand2;

      simplifiedOperand1 = this.visit(expr.operand1);
      simplifiedOperand2 = this.visit(expr.operand2);
      if (simplifiedOperand1 === expr.operand1 &&
          simplifiedOperand2 === expr.operand2) {
         return applySteps(expr);
      }

      return applySteps(Symbolic.binOp(expr.operator,
                                       simplifiedOperand1,
                                       simplifiedOperand2));
   };
   Simplifier.prototype.visitFunction = function(expr) {
      var simplifiedArgument;

      simplifiedArgument = this.visit(expr.argument);
      if (simplifiedArgument === expr.argument) {
         return applySteps(expr);
      }

      return applySteps(Symbolic.func(expr.name, simplifiedArgument));
   };

   function applySteps(expr) {
      return steps.reduce(function(prev, step) {
         return step.step.visit(prev);
      }, expr);
   }

   /**
    * Step objects are to be constructed as instances of this class.
    * `methods` is an object used to provide overwrites for the appropriate visitor
    * methods. Most steps will likely want to at least overwrite `visitBinOp`.
    */
   Simplifier.Step = {
      new: function(methods) {
         var obj;

         obj = Object.create(Simplifier.Step.prototype);
         Object.keys(methods).forEach(function(key) {
            obj[key] = methods[key];
         });

         return obj;
      }
   };

   Simplifier.Step.prototype = Object.create(ExpressionVisitor.prototype);

   Simplifier.Step.prototype.visitNumber = function(expr) { return expr; };
   Simplifier.Step.prototype.visitVariable = function(expr) { return expr; };
   Simplifier.Step.prototype.visitParens = function(expr) { return expr; };
   Simplifier.Step.prototype.visitBinOp = function(expr) { return expr; };
   Simplifier.Step.prototype.visitFunction = function(expr) { return expr; };

   Simplifier.addStep('zeroOneBinops', {
      visitBinOp: function(expr) {
         switch (expr.operator) {
         case '+':
            if (expr.operand1.isNumber() && expr.operand1.number === 0) {
               return expr.operand2;
            }
            if (expr.operand2.isNumber() && expr.operand2.number === 0) {
               return expr.operand1;
            }
            break;
         case '-':
            if (expr.operand2.isNumber() && expr.operand2.number === 0) {
               return expr.operand1;
            }
            break;
         case '*':
            if (expr.operand1.isNumber() && expr.operand1.number === 0) {
               return expr.operand1;
            }
            if (expr.operand2.isNumber() && expr.operand2.number === 0) {
               return expr.operand2;
            }
            if (expr.operand1.isNumber() && expr.operand1.number === 1) {
               return expr.operand2;
            }
            if (expr.operand2.isNumber() && expr.operand2.number === 1) {
               return expr.operand1;
            }
            break;
         case '/':
            if (expr.operand1.isNumber() && expr.operand1.number === 0) {
               return expr.operand1;
            }
            // TODO: Need to deal with 0 denominator
            if (expr.operand2.isNumber() && expr.operand2.number === 1) {
               return expr.operand1;
            }
            break;
         case '^':
            if (expr.operand2.isNumber() && expr.operand2.number === 0) {
               return Symbolic.number(1);
            }
            if (expr.operand1.isNumber() && expr.operand1.number === 0) {
               return expr.operand1;
            }
            if (expr.operand2.isNumber() && expr.operand2.number === 1) {
               return expr.operand1;
            }
            break;
         default: break;
         }

         return expr;
      }
   });

   Simplifier.addStep('numbersFirst', {
      visitBinOp: function(expr) {
         switch (expr.operator) {
         case '+':
         case '*':
            if (expr.operand2.isNumber() && !expr.operand1.isNumber()) {
               return Symbolic.binOp(expr.operator, expr.operand2, expr.operand1);
            }
            break;
         case '-':
            if (expr.operand2.isNumber() && !expr.operand1.isNumber()) {
               return Symbolic.plus(
                        Symbolic.uminus(expr.operand2),
                        expr.operand1);
            }
            break;
         case '/':
            if (expr.operand2.isNumber() && !expr.operand1.isNumber()) {
               return Symbolic.times(
                        Symbolic.number(1).over(expr.operand2),
                        expr.operand1);
            }
            break;
         default: break;
         }

         return expr;
      }
   });

   Simplifier.addStep('numbersCombined', {
      // TODO: Maybe should not evaluate quotients
      visitBinOp: function(expr) {
         if (expr.operand1.isNumber() && expr.operand2.isNumber()) {
            return Symbolic.number(doOp(expr.operator,
                                        expr.operand1.number,
                                        expr.operand2.number));
         }

         return expr;
      }
   });

   Simplifier.addStep('associateLeft', {
      visitBinOp: function(expr) {
         var op1, op2, term1, term2, term3;

         if (expr.operand2.isBinOp()) {
            op1 = expr.operator;
            op2 = expr.operand2.operator;
            term1 = expr.operand1;
            term2 = expr.operand2.operand1;
            term3 = expr.operand2.operand2;

            if (op1 === '+' && (op2 === '+' || op2 === '-') ||
                op1 === '*' && (op2 === '*' || op2 === '/')) {
               return Symbolic.binOp(op2,
                        Symbolic.binOp(op1, term1, term2),
                        term3);
            }
            if (op1 === '-' && op2 === '-') {
               return Symbolic.minus(
                        Symbolic.plus(term1, term2),
                        term3);
            }
            if (op1 === '/' && op2 === '/') {
               return Symbolic.quot(
                        term1,
                        Symbolic.times(term2, term3));
            }
         }

         return expr;
      }
   });

   // TODO: Should really not have to repeat this. Move to its own file
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

   return Simplifier;
});
}(typeof module === 'object' && typeof define !== 'function' ? function(factory) {
   module.exports = factory(require, exports, module);
} : define));
