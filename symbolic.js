/*
 * symbolic.js
 */
(function(define) {
define(function(require, exports, module) {
   var Symbolic, Parser;

   Parser = require('./parser');

   Symbolic = {
      // Build a symbolic structure based on a string expression
      fromString: function(expr) {
         try {
            return Parser.parse(expr);
         } catch (e) {
            console.log('Serious parser error:', e);

            return null;
         }
      },
      /*
       * Return an expression based on the value. If the value is a number
       * it becomes a Symbolic.Number. If it is a Symbolic expression already
       * then it is returned. No other values are allowed at this point.
       */
      fromValue: function(value) {
         if (value instanceof Symbolic) { return value; }
         if (typeof value === 'number') { return Symbolic.Number.new(value); }
         throw new Error('Can only convert numbers and Symbolic expressions');
      }
   };

   // Prototype that others inherit from
   // Mostly here to express the interface
   Symbolic.prototype = {
      /**
       * All `Symbolic` objects must contain a `params` property, which
       * is an object that contains as keys the parameters that the expression
       * contains.
       *
       * All subclasses (except for Numbers) shadow this when creating a new
       * object.
       */
      params: {},
      /*
       * Visitor pattern. Visitors must implement:
       *
       * - `visitNumber`
       * - `visitVariable`
       * - `visitBinop`
       * - `visitParens`
       * - `visitFunction`
       */
      accept: function(visitor) {
         throw new Error('Subclasses must implement accept.');
      },
      /*
       * Returns true if the expression represents an actual number.
       * Only Symbolic.Number should really be returning true.
       */
      isNumber: function() { return false; },
      /*
       * Returns true if the expression represents a binary operation.
       * Only Symbolic.BinOp should really be returning true.
       */
      isBinOp: function() { return false; }
   };

   /**
    * Symbolic.Number
    *
    * Represents numbers
    */
   Symbolic.Number = {
      new: function(number) {
         var obj;

         obj = Object.create(Symbolic.Number.prototype);
         obj.number = number;

         return obj;
      }
   };

   Symbolic.Number.prototype = Object.create(Symbolic.prototype);

   Symbolic.Number.prototype.isNumber = function() { return true; };
   Symbolic.Number.prototype.add = function(n) {
      return Symbolic.number(this.number + n);
   };
   Symbolic.Number.prototype.sub = function(n) {
      return this.add(-n);
   };
   Symbolic.Number.prototype.accept = function(visitor) {
      return visitor.visitNumber(this);
   };

   /**
    * Symbolic.Variable
    *
    * Represents variables
    */
   Symbolic.Variable = {
      new: function(variable) {
         var obj;

         obj = Object.create(Symbolic.Variable.prototype);
         obj.variable = variable;
         obj.params = makeObjectFromKey(variable);

         return obj;
      }
   };

   Symbolic.Variable.prototype = Object.create(Symbolic.prototype);

   Symbolic.Variable.prototype.accept = function(visitor) {
      return visitor.visitVariable(this);
   };

   /**
    * BinOp
    *
    * Binary operator
    */
   Symbolic.BinOp = {
      new: function(operator, expr1, expr2) {
         var obj;

         obj = Object.create(Symbolic.BinOp.prototype);
         obj.operator = operator;
         obj.operand1 = expr1;
         obj.operand2 = expr2;
         obj.params = mergeKeys(expr1.params, expr2.params);

         return obj;
      }
   };

   Symbolic.BinOp.prototype = Object.create(Symbolic.prototype);

   Symbolic.BinOp.prototype.isBinOp = function() { return true; };
   Symbolic.BinOp.prototype.accept = function(visitor) {
      return visitor.visitBinOp(this);
   };

   /**
    * Parens
    *
    * Parenthesized expression
    */
   Symbolic.Parens = {
      new: function(expr) {
         var obj;

         obj = Object.create(Symbolic.Parens.prototype);
         obj.expr = expr;
         obj.params = mergeKeys(expr.params);

         return obj;
      }
   };

   Symbolic.Parens.prototype = Object.create(Symbolic.prototype);

   Symbolic.Parens.prototype.accept = function(visitor) {
      return visitor.visitParens(this);
   };

   /**
    * Symbolic.Function
    *
    * Represents single-value functions (sin, cos etc)
    */
   Symbolic.Function = {
      new: function(funName, arg) {
         var obj;

         obj = Object.create(Symbolic.Function.prototype);
         obj.name = funName;
         obj.arg = arg;
         obj.params = mergeKeys(arg.params);

         return obj;
      }
   };

   Symbolic.Function.prototype = Object.create(Symbolic.prototype);

   Symbolic.Function.prototype.accept = function(visitor) {
      return visitor.visitFunction(this);
   };

   // CONVENIENCE METHODS ADDED HERE
   Symbolic.number = Symbolic.Number.new.bind(Symbolic.Number);
   Symbolic.var = Symbolic.Variable.new.bind(Symbolic.Variable);
   Symbolic.binOp = Symbolic.BinOp.new.bind(Symbolic.BinOp);
   Symbolic.plus = Symbolic.BinOp.new.bind(Symbolic.BinOp, '+');
   Symbolic.minus = Symbolic.BinOp.new.bind(Symbolic.BinOp, '-');
   Symbolic.uminus = Symbolic.BinOp.new.bind(Symbolic.BinOp, '-', Symbolic.number(0));
   Symbolic.times = Symbolic.BinOp.new.bind(Symbolic.BinOp, '*');
   Symbolic.quot = Symbolic.BinOp.new.bind(Symbolic.BinOp, '/');
   Symbolic.power = Symbolic.BinOp.new.bind(Symbolic.BinOp, '^');
   Symbolic.parens = Symbolic.Parens.new.bind(Symbolic.Parens);
   Symbolic.func = Symbolic.Function.new.bind(Symbolic.Function);
   Symbolic.sin = Symbolic.Function.new.bind(Symbolic.Function, 'sin');
   Symbolic.cos = Symbolic.Function.new.bind(Symbolic.Function, 'cos');
   Symbolic.tan = Symbolic.Function.new.bind(Symbolic.Function, 'tan');
   Symbolic.sec = Symbolic.Function.new.bind(Symbolic.Function, 'sec');
   Symbolic.exp = Symbolic.Function.new.bind(Symbolic.Function, 'exp');
   Symbolic.ln = Symbolic.Function.new.bind(Symbolic.Function, 'ln');

   Symbolic.prototype.plus = function(expr) {
      return Symbolic.plus(this, expr);
   };
   Symbolic.prototype.minus = function(expr) {
      return Symbolic.minus(this, expr);
   };
   Symbolic.prototype.times = function(expr) {
      return Symbolic.times(this, expr);
   };
   Symbolic.prototype.over = function(expr) {
      return Symbolic.quot(this, expr);
   };
   Symbolic.prototype.power = function(expr) {
      return Symbolic.power(this, expr);
   };
   //
   //
   // Helpers
   //
   // Returns an new object that is the result of collecting the keys
   // of all its arguments
   function mergeKeys() {
      var result, i, key;

      result = {};

      for (i = 0; i < arguments.length; i += 1) {
         for (key in arguments[i]) {
            if (arguments[i].hasOwnProperty(key)) {
               result[key] = true;
            }
         }
      }

      return result;
   }

   // Returns an object with a single key
   function makeObjectFromKey(key) {
      var obj;

      obj = {};
      obj[key] = true;

      return obj;
   }

   return Symbolic;
});
}(typeof module === 'object' && typeof define !== 'function' ? function(factory) {
   module.exports = factory(require, exports, module);
} : define));
