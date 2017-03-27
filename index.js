(function(define) {
define(function(require, exports, module) {
   var Symbolic, Evaluator, Deriver, Simplifier, StringPrinter;

   Symbolic = require('./symbolic');
   Evaluator = require('./visitors/evaluator');
   Deriver = require('./visitors/deriver');
   StringPrinter = require('./visitors/stringPrinter');
   Simplifier = require('./visitors/simplifier');

   /**
    * Evaluates the expression with given parameter values.
    * `values` must be an object whose keys are parameters to
    * be used for substituting in the expression's variables,
    * and whose values are the values to use in the substitution.
    *
    * The result will be another expression.
    */
   Symbolic.prototype.evalAt = function(values) {
      return Evaluator.new(values).visit(this);
   };

   /**
    * Computes the derivative of the expression with respect to a given `variable`,
    * Keeping all other variables constant. Does not perform any simplifications.
    */
   Symbolic.prototype.derivative = function(variable) {
      return Deriver.new(variable).visit(this);
   };

   /**
    * Turns the expression into a string. By default uses no symbol for products.
    * TODO: Add more options about the spacing.
    */
   Symbolic.prototype.toString = function(starForProduct) {
      return StringPrinter.new(starForProduct).visit(this);
   };

   /**
    * Performs algebraic simplification to an expression.
    * TODO: Consider adding options.
    */
   Symbolic.prototype.simplify = function() {
      return Simplifier.new().simplify(this);
   };

   return Symbolic;
});
}(typeof module === 'object' && typeof define !== 'function' ? function(factory) {
   module.exports = factory(require, exports, module);
} : define));
