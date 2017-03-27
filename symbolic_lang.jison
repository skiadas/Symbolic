%lex

%%

[ \t]+                    {/* skip whitespace */}
0x[0-9a-fA-F]+            return 'HEXNUM';
((0|[1-9][0-9]*)(\.[0-9]*)?|\.[0-9]+)([eE][+-]?[0-9]+)? return 'NUM';
\n                        {/* skip newlines */}
[+\-*^/()]                return yytext;
sin|cos|tan|sec|exp|ln    return 'FUN';
[a-zA-Z]+                 return 'VAR';
<<EOF>>                   return 'EOF';

/lex

%{
// TODO: Do we need something to load Symbolic?
%}

%left 'EOL'
%left '+' '-'
%left '*' '/'
%left 'UMINUS'
%left 'FACTOR'
%right '^'
%nonassoc 'FUN'
%nonassoc '('

%start result

%%

result
   : expr EOF  { return $1; }
   ;

expr
   : term          { $$ = $1; }
   | expr '+' term { $$ = Symbolic.BinOp.new('+', $1, $3); }
   | expr '-' term { $$ = Symbolic.BinOp.new('-', $1, $3); }
   | '-' term  %prec UMINUS { $$ = Symbolic.BinOp.new('-', Symbolic.Number.new(0), $2); }
   | '+' term  %prec UMINUS { $$ = $2; }
   ;

term
   : call        { $$ = $1; }
   | term call    { $$ = Symbolic.BinOp.new('*', $1, $2); }
   | term '*' call { $$ = Symbolic.BinOp.new('*', $1, $3); }
   | term '/' call { $$ = Symbolic.BinOp.new('/', $1, $3); }
   | call '^' call { $$ = Symbolic.BinOp.new('^', $1, $3); }
   ;

call
   : atom          { $$ = $1; }
   | FUN call %prec FUN  { $$ = Symbolic.Function.new($1, $2); }
   ;

atom
   : NUM           { $$ = Symbolic.Number.new(parseFloat($1)); }
   | HEXNUM        { $$ = Symbolic.Number.new(parseInt($1)); }
   | VAR           { $$ = Symbolic.Variable.new($1); }
   | '(' expr ')'  { $$ = Symbolic.Parens.new($2); }
   ;
