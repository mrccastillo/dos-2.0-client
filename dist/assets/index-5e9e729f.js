his.next();
    return this.finishNode(node, "Literal")

  case types$1.parenL:
    var start = this.start, expr = this.parseParenAndDistinguishExpression(canBeArrow, forInit);
    if (refDestructuringErrors) {
      if (refDestructuringErrors.parenthesizedAssign < 0 && !this.isSimpleAssignTarget(expr))
        { refDestructuringErrors.parenthesizedAssign = start; }
      if (refDestructuringErrors.parenthesizedBind < 0)
        { refDestructuringErrors.parenthesizedBind = start; }
    }
    return expr

  case types$1.bracketL:
    node = this.startNode();
    this.next();
    node.elements = this.parseExprList(types$1.bracketR, true, true, refDestructuringErrors);
    return this.finishNode(node, "ArrayExpression")

  case types$1.braceL:
    this.overrideContext(types.b_expr);
    return this.parseObj(false, refDestructuringErrors)

  case types$1._function:
    node = this.startNode();
    this.next();
    return this.parseFunction(node, 0)

  case types$1._class:
    return this.parseClass(this.startNode(), false)

  case types$1._new:
    return this.parseNew()

  case types$1.backQuote:
    return this.parseTemplate()

  case types$1._import:
    if (this.options.ecmaVersion >= 11) {
      return this.parseExprImport(forNew)
    } else {
      return this.unexpected()
    }

  default:
    return this.parseExprAtomDefault()
  }
};

pp$5.parseExprAtomDefault = function() {
  this.unexpected();
};

pp$5.parseExprImport = function(forNew) {
  var node = this.startNode();

  // Consume `import` as an identifier for `import.meta`.
  // Because `this.parseIdent(true)` doesn't check escape sequences, it needs the check of `this.containsEsc`.
  if (this.containsEsc) { this.raiseRecoverable(this.start, "Escape sequence in keyword import"); }
  var meta = this.parseIdent(true);

  if (this.type === types$1.parenL && !forNew) {
    return this.parseDynamicImport(node)
  } else if (this.type === types$1.dot) {
    node.meta = meta;
    return this.parseImportMeta(node)
  } else {
    this.unexpected();
  }
};

pp$5.parseDynamicImport = function(node) {
  this.next(); // skip `(`

  // Parse node.source.
  node.source = this.parseMaybeAssign();

  // Verify ending.
  if (!this.eat(types$1.parenR)) {
    var errorPos = this.start;
    if (this.eat(types$1.comma) && this.eat(types$1.parenR)) {
      this.raiseRecoverable(errorPos, "Trailing comma is not allowed in import()");
    } else {
      this.unexpected(errorPos);
    }
  }

  return this.finishNode(node, "ImportExpression")
};

pp$5.parseImportMeta = function(node) {
  this.next(); // skip `.`

  var containsEsc = this.containsEsc;
  node.property = this.parseIdent(true);

  if (node.property.name !== "meta")
    { this.raiseRecoverable(node.property.start, "The only valid meta property for import is 'import.meta'"); }
  if (containsEsc)
    { this.raiseRecoverable(node.start, "'import.meta' must not contain escaped characters"); }
  if (this.options.sourceType !== "module" && !this.options.allowImportExportEverywhere)
    { this.raiseRecoverable(node.start, "Cannot use 'import.meta' outside a module"); }

  return this.finishNode(node, "MetaProperty")
};

pp$5.parseLiteral = function(value) {
  var node = this.startNode();
  node.value = value;
  node.raw = this.input.slice(this.start, this.end);
  if (node.raw.charCodeAt(node.raw.length - 1) === 110) { node.bigint = node.raw.slice(0, -1).replace(/_/g, ""); }
  this.next();
  return this.finishNode(node, "Literal")
};

pp$5.parseParenExpression = function() {
  this.expect(types$1.parenL);
  var val = this.parseExpression();
  this.expect(types$1.parenR);
  return val
};

pp$5.shouldParseArrow = function(exprList) {
  return !this.canInsertSemicolon()
};

pp$5.parseParenAndDistinguishExpression = function(canBeArrow, forInit) {
  var startPos = this.start, startLoc = this.startLoc, val, allowTrailingComma = this.options.ecmaVersion >= 8;
  if (this.options.ecmaVersion >= 6) {
    this.next();

    var innerStartPos = this.start, innerStartLoc = this.startLoc;
    var exprList = [], first = true, lastIsComma = false;
    var refDestructuringErrors = new DestructuringErrors, oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, spreadStart;
    this.yieldPos = 0;
    this.awaitPos = 0;
    // Do not save awaitIdentPos to allow checking awaits nested in parameters
    while (this.type !== types$1.parenR) {
      first ? first = false : this.expect(types$1.comma);
      if (allowTrailingComma && this.afterTrailingComma(types$1.parenR, true)) {
        lastIsComma = true;
        break
      } else if (this.type === types$1.ellipsis) {
        spreadStart = this.start;
        exprList.push(this.parseParenItem(this.parseRestBinding()));
        if (this.type === types$1.comma) {
          this.raiseRecoverable(
            this.start,
            "Comma is not permitted after the rest element"
          );
        }
        break
      } else {
        exprList.push(this.parseMaybeAssign(false, refDestructuringErrors, this.parseParenItem));
      }
    }
    var innerEndPos = this.lastTokEnd, innerEndLoc = this.lastTokEndLoc;
    this.expect(types$1.parenR);

    if (canBeArrow && this.shouldParseArrow(exprList) && this.eat(types$1.arrow)) {
      this.checkPatternErrors(refDestructuringErrors, false);
      this.checkYieldAwaitInDefaultParams();
      this.yieldPos = oldYieldPos;
      this.awaitPos = oldAwaitPos;
      return this.parseParenArrowList(startPos, startLoc, exprList, forInit)
    }

    if (!exprList.length || lastIsComma) { this.unexpected(this.lastTokStart); }
    if (spreadStart) { this.unexpected(spreadStart); }
    this.checkExpressionErrors(refDestructuringErrors, true);
    this.yieldPos = oldYieldPos || this.yieldPos;
    this.awaitPos = oldAwaitPos || this.awaitPos;

    if (exprList.length > 1) {
      val = this.startNodeAt(innerStartPos, innerStartLoc);
      val.expressions = exprList;
      this.finishNodeAt(val, "SequenceExpression", innerEndPos, innerEndLoc);
    } else {
      val = exprList[0];
    }
  } else {
    val = this.parseParenExpression();
  }

  if (this.options.preserveParens) {
    var par = this.startNodeAt(startPos, startLoc);
    par.expression = val;
    return this.finishNode(par, "ParenthesizedExpression")
  } else {
    return val
  }
};

pp$5.parseParenItem = function(item) {
  return item
};

pp$5.parseParenArrowList = function(startPos, startLoc, exprList, forInit) {
  return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), exprList, false, forInit)
};

// New's precedence is slightly tricky. It must allow its argument to
// be a `[]` or dot subscript expression, but not a call — at least,
// not without wrapping it in parentheses. Thus, it uses the noCalls
// argument to parseSubscripts to prevent it from consuming the
// argument list.

var empty = [];

pp$5.parseNew = function() {
  if (this.containsEsc) { this.raiseRecoverable(this.start, "Escape sequence in keyword new"); }
  var node = this.startNode();
  var meta = this.parseIdent(true);
  if (this.options.ecmaVersion >= 6 && this.eat(types$1.dot)) {
    node.meta = meta;
    var containsEsc = this.containsEsc;
    node.property = this.parseIdent(true);
    if (node.property.name !== "target")
      { this.raiseRecoverable(node.property.start, "The only valid meta property for new is 'new.target'"); }
    if (containsEsc)
      { this.raiseRecoverable(node.start, "'new.target' must not contain escaped characters"); }
    if (!this.allowNewDotTarget)
      { this.raiseRecoverable(node.start, "'new.target' can only be used in functions and class static block"); }
    return this.finishNode(node, "MetaProperty")
  }
  var startPos = this.start, startLoc = this.startLoc;
  node.callee = this.parseSubscripts(this.parseExprAtom(null, false, true), startPos, startLoc, true, false);
  if (this.eat(types$1.parenL)) { node.arguments = this.parseExprList(types$1.parenR, this.options.ecmaVersion >= 8, false); }
  else { node.arguments = empty; }
  return this.finishNode(node, "NewExpression")
};

// Parse template expression.

pp$5.parseTemplateElement = function(ref) {
  var isTagged = ref.isTagged;

  var elem = this.startNode();
  if (this.type === types$1.invalidTemplate) {
    if (!isTagged) {
      this.raiseRecoverable(this.start, "Bad escape sequence in untagged template literal");
    }
    elem.value = {
      raw: this.value,
      cooked: null
    };
  } else {
    elem.value = {
      raw: this.input.slice(this.start, this.end).replace(/\r\n?/g, "\n"),
      cooked: this.value
    };
  }
  this.next();
  elem.tail = this.type === types$1.backQuote;
  return this.finishNode(elem, "TemplateElement")
};

pp$5.parseTemplate = function(ref) {
  if ( ref === void 0 ) ref = {};
  var isTagged = ref.isTagged; if ( isTagged === void 0 ) isTagged = false;

  var node = this.startNode();
  this.next();
  node.expressions = [];
  var curElt = this.parseTemplateElement({isTagged: isTagged});
  node.quasis = [curElt];
  while (!curElt.tail) {
    if (this.type === types$1.eof) { this.raise(this.pos, "Unterminated template literal"); }
    this.expect(types$1.dollarBraceL);
    node.expressions.push(this.parseExpression());
    this.expect(types$1.braceR);
    node.quasis.push(curElt = this.parseTemplateElement({isTagged: isTagged}));
  }
  this.next();
  return this.finishNode(node, "TemplateLiteral")
};

pp$5.isAsyncProp = function(prop) {
  return !prop.computed && prop.key.type === "Identifier" && prop.key.name === "async" &&
    (this.type === types$1.name || this.type === types$1.num || this.type === types$1.string || this.type === types$1.bracketL || this.type.keyword || (this.options.ecmaVersion >= 9 && this.type === types$1.star)) &&
    !lineBreak.test(this.input.slice(this.lastTokEnd, this.start))
};

// Parse an object literal or binding pattern.

pp$5.parseObj = function(isPattern, refDestructuringErrors) {
  var node = this.startNode(), first = true, propHash = {};
  node.properties = [];
  this.next();
  while (!this.eat(types$1.braceR)) {
    if (!first) {
      this.expect(types$1.comma);
      if (this.options.ecmaVersion >= 5 && this.afterTrailingComma(types$1.braceR)) { break }
    } else { first = false; }

    var prop = this.parseProperty(isPattern, refDestructuringErrors);
    if (!isPattern) { this.checkPropClash(prop, propHash, refDestructuringErrors); }
    node.properties.push(prop);
  }
  return this.finishNode(node, isPattern ? "ObjectPattern" : "ObjectExpression")
};

pp$5.parseProperty = function(isPattern, refDestructuringErrors) {
  var prop = this.startNode(), isGenerator, isAsync, startPos, startLoc;
  if (this.options.ecmaVersion >= 9 && this.eat(types$1.ellipsis)) {
    if (isPattern) {
      prop.argument = this.parseIdent(false);
      if (this.type === types$1.comma) {
        this.raiseRecoverable(this.start, "Comma is not permitted after the rest element");
      }
      return this.finishNode(prop, "RestElement")
    }
    // Parse argument.
    prop.argument = this.parseMaybeAssign(false, refDestructuringErrors);
    // To disallow trailing comma via `this.toAssignable()`.
    if (this.type === types$1.comma && refDestructuringErrors && refDestructuringErrors.trailingComma < 0) {
      refDestructuringErrors.trailingComma = this.start;
    }
    // Finish
    return this.finishNode(prop, "SpreadElement")
  }
  if (this.options.ecmaVersion >= 6) {
    prop.method = false;
    prop.shorthand = false;
    if (isPattern || refDestructuringErrors) {
      startPos = this.start;
      startLoc = this.startLoc;
    }
    if (!isPattern)
      { isGenerator = this.eat(types$1.star); }
  }
  var containsEsc = this.containsEsc;
  this.parsePropertyName(prop);
  if (!isPattern && !containsEsc && this.options.ecmaVersion >= 8 && !isGenerator && this.isAsyncProp(prop)) {
    isAsync = true;
    isGenerator = this.options.ecmaVersion >= 9 && this.eat(types$1.star);
    this.parsePropertyName(prop);
  } else {
    isAsync = false;
  }
  this.parsePropertyValue(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors, containsEsc);
  return this.finishNode(prop, "Property")
};

pp$5.parseGetterSetter = function(prop) {
  prop.kind = prop.key.name;
  this.parsePropertyName(prop);
  prop.value = this.parseMethod(false);
  var paramCount = prop.kind === "get" ? 0 : 1;
  if (prop.value.params.length !== paramCount) {
    var start = prop.value.start;
    if (prop.kind === "get")
      { this.raiseRecoverable(start, "getter should have no params"); }
    else
      { this.raiseRecoverable(start, "setter should have exactly one param"); }
  } else {
    if (prop.kind === "set" && prop.value.params[0].type === "RestElement")
      { this.raiseRecoverable(prop.value.params[0].start, "Setter cannot use rest params"); }
  }
};

pp$5.parsePropertyValue = function(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors, containsEsc) {
  if ((isGenerator || isAsync) && this.type === types$1.colon)
    { this.unexpected(); }

  if (this.eat(types$1.colon)) {
    prop.value = isPattern ? this.parseMaybeDefault(this.start, this.startLoc) : this.parseMaybeAssign(false, refDestructuringErrors);
    prop.kind = "init";
  } else if (this.options.ecmaVersion >= 6 && this.type === types$1.parenL) {
    if (isPattern) { this.unexpected(); }
    prop.kind = "init";
    prop.method = true;
    prop.value = this.parseMethod(isGenerator, isAsync);
  } else if (!isPattern && !containsEsc &&
             this.options.ecmaVersion >= 5 && !prop.computed && prop.key.type === "Identifier" &&
             (prop.key.name === "get" || prop.key.name === "set") &&
             (this.type !== types$1.comma && this.type !== types$1.braceR && this.type !== types$1.eq)) {
    if (isGenerator || isAsync) { this.unexpected(); }
    this.parseGetterSetter(prop);
  } else if (this.options.ecmaVersion >= 6 && !prop.computed && prop.key.type === "Identifier") {
    if (isGenerator || isAsync) { this.unexpected(); }
    this.checkUnreserved(prop.key);
    if (prop.key.name === "await" && !this.awaitIdentPos)
      { this.awaitIdentPos = startPos; }
    prop.kind = "init";
    if (isPattern) {
      prop.value = this.parseMaybeDefault(startPos, startLoc, this.copyNode(prop.key));
    } else if (this.type === types$1.eq && refDestructuringErrors) {
      if (refDestructuringErrors.shorthandAssign < 0)
        { refDestructuringErrors.shorthandAssign = this.start; }
      prop.value = this.parseMaybeDefault(startPos, startLoc, this.copyNode(prop.key));
    } else {
      prop.value = this.copyNode(prop.key);
    }
    prop.shorthand = true;
  } else { this.unexpected(); }
};

pp$5.parsePropertyName = function(prop) {
  if (this.options.ecmaVersion >= 6) {
    if (this.eat(types$1.bracketL)) {
      prop.computed = true;
      prop.key = this.parseMaybeAssign();
      this.expect(types$1.bracketR);
      return prop.key
    } else {
      prop.computed = false;
    }
  }
  return prop.key = this.type === types$1.num || this.type === types$1.string ? this.parseExprAtom() : this.parseIdent(this.options.allowReserved !== "never")
};

// Initialize empty function node.

pp$5.initFunction = function(node) {
  node.id = null;
  if (this.options.ecmaVersion >= 6) { node.generator = node.expression = false; }
  if (this.options.ecmaVersion >= 8) { node.async = false; }
};

// Parse object or class method.

pp$5.parseMethod = function(isGenerator, isAsync, allowDirectSuper) {
  var node = this.startNode(), oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;

  this.initFunction(node);
  if (this.options.ecmaVersion >= 6)
    { node.generator = isGenerator; }
  if (this.options.ecmaVersion >= 8)
    { node.async = !!isAsync; }

  this.yieldPos = 0;
  this.awaitPos = 0;
  this.awaitIdentPos = 0;
  this.enterScope(functionFlags(isAsync, node.generator) | SCOPE_SUPER | (allowDirectSuper ? SCOPE_DIRECT_SUPER : 0));

  this.expect(types$1.parenL);
  node.params = this.parseBindingList(types$1.parenR, false, this.options.ecmaVersion >= 8);
  this.checkYieldAwaitInDefaultParams();
  this.parseFunctionBody(node, false, true, false);

  this.yieldPos = oldYieldPos;
  this.awaitPos = oldAwaitPos;
  this.awaitIdentPos = oldAwaitIdentPos;
  return this.finishNode(node, "FunctionExpression")
};

// Parse arrow function expression with given parameters.

pp$5.parseArrowExpression = function(node, params, isAsync, forInit) {
  var oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;

  this.enterScope(functionFlags(isAsync, false) | SCOPE_ARROW);
  this.initFunction(node);
  if (this.options.ecmaVersion >= 8) { node.async = !!isAsync; }

  this.yieldPos = 0;
  this.awaitPos = 0;
  this.awaitIdentPos = 0;

  node.params = this.toAssignableList(params, true);
  this.parseFunctionBody(node, true, false, forInit);

  this.yieldPos = oldYieldPos;
  this.awaitPos = oldAwaitPos;
  this.awaitIdentPos = oldAwaitIdentPos;
  return this.finishNode(node, "ArrowFunctionExpression")
};

// Parse function body and check parameters.

pp$5.parseFunctionBody = function(node, isArrowFunction, isMethod, forInit) {
  var isExpression = isArrowFunction && this.type !== types$1.braceL;
  var oldStrict = this.strict, useStrict = false;

  if (isExpression) {
    node.body = this.parseMaybeAssign(forInit);
    node.expression = true;
    this.checkParams(node, false);
  } else {
    var nonSimple = this.options.ecmaVersion >= 7 && !this.isSimpleParamList(node.params);
    if (!oldStrict || nonSimple) {
      useStrict = this.strictDirective(this.end);
      // If this is a strict mode function, verify that argument names
      // are not repeated, and it does not try to bind the words `eval`
      // or `arguments`.
      if (useStrict && nonSimple)
        { this.raiseRecoverable(node.start, "Illegal 'use strict' directive in function with non-simple parameter list"); }
    }
    // Start a new scope with regard to labels and the `inFunction`
    // flag (restore them to their old value afterwards).
    var oldLabels = this.labels;
    this.labels = [];
    if (useStrict) { this.strict = true; }

    // Add the params to varDeclaredNames to ensure that an error is thrown
    // if a let/const declaration in the function clashes with one of the params.
    this.checkParams(node, !oldStrict && !useStrict && !isArrowFunction && !isMethod && this.isSimpleParamList(node.params));
    // Ensure the function name isn't a forbidden identifier in strict mode, e.g. 'eval'
    if (this.strict && node.id) { this.checkLValSimple(node.id, BIND_OUTSIDE); }
    node.body = this.parseBlock(false, undefined, useStrict && !oldStrict);
    node.expression = false;
    this.adaptDirectivePrologue(node.body.body);
    this.labels = oldLabels;
  }
  this.exitScope();
};

pp$5.isSimpleParamList = function(params) {
  for (var i = 0, list = params; i < list.length; i += 1)
    {
    var param = list[i];

    if (param.type !== "Identifier") { return false
  } }
  return true
};

// Checks function params for various disallowed patterns such as using "eval"
// or "arguments" and duplicate parameters.

pp$5.checkParams = function(node, allowDuplicates) {
  var nameHash = Object.create(null);
  for (var i = 0, list = node.params; i < list.length; i += 1)
    {
    var param = list[i];

    this.checkLValInnerPattern(param, BIND_VAR, allowDuplicates ? null : nameHash);
  }
};

// Parses a comma-separated list of expressions, and returns them as
// an array. `close` is the token type that ends the list, and
// `allowEmpty` can be turned on to allow subsequent commas with
// nothing in between them to be parsed as `null` (which is needed
// for array literals).

pp$5.parseExprList = function(close, allowTrailingComma, allowEmpty, refDestructuringErrors) {
  var elts = [], first = true;
  while (!this.eat(close)) {
    if (!first) {
      this.expect(types$1.comma);
      if (allowTrailingComma && this.afterTrailingComma(close)) { break }
    } else { first = false; }

    var elt = (void 0);
    if (allowEmpty && this.type === types$1.comma)
      { elt = null; }
    else if (this.type === types$1.ellipsis) {
      elt = this.parseSpread(refDestructuringErrors);
      if (refDestructuringErrors && this.type === types$1.comma && refDestructuringErrors.trailingComma < 0)
        { refDestructuringErrors.trailingComma = this.start; }
    } else {
      elt = this.parseMaybeAssign(false, refDestructuringErrors);
    }
    elts.push(elt);
  }
  return elts
};

pp$5.checkUnreserved = function(ref) {
  var start = ref.start;
  var end = ref.end;
  var name = ref.name;

  if (this.inGenerator && name === "yield")
    { this.raiseRecoverable(start, "Cannot use 'yield' as identifier inside a generator"); }
  if (this.inAsync && name === "await")
    { this.raiseRecoverable(start, "Cannot use 'await' as identifier inside an async function"); }
  if (this.currentThisScope().inClassFieldInit && name === "arguments")
    { this.raiseRecoverable(start, "Cannot use 'arguments' in class field initializer"); }
  if (this.inClassStaticBlock && (name === "arguments" || name === "await"))
    { this.raise(start, ("Cannot use " + name + " in class static initialization block")); }
  if (this.keywords.test(name))
    { this.raise(start, ("Unexpected keyword '" + name + "'")); }
  if (this.options.ecmaVersion < 6 &&
    this.input.slice(start, end).indexOf("\\") !== -1) { return }
  var re = this.strict ? this.reservedWordsStrict : this.reservedWords;
  if (re.test(name)) {
    if (!this.inAsync && name === "await")
      { this.raiseRecoverable(start, "Cannot use keyword 'await' outside an async function"); }
    this.raiseRecoverable(start, ("The keyword '" + name + "' is reserved"));
  }
};

// Parse the next token as an identifier. If `liberal` is true (used
// when parsing properties), it will also convert keywords into
// identifiers.

pp$5.parseIdent = function(liberal) {
  var node = this.parseIdentNode();
  this.next(!!liberal);
  this.finishNode(node, "Identifier");
  if (!liberal) {
    this.checkUnreserved(node);
    if (node.name === "await" && !this.awaitIdentPos)
      { this.awaitIdentPos = node.start; }
  }
  return node
};

pp$5.parseIdentNode = function() {
  var node = this.startNode();
  if (this.type === types$1.name) {
    node.name = this.value;
  } else if (this.type.keyword) {
    node.name = this.type.keyword;

    // To fix https://github.com/acornjs/acorn/issues/575
    // `class` and `function` keywords push new context into this.context.
    // But there is no chance to pop the context if the keyword is consumed as an identifier such as a property name.
    // If the previous token is a dot, this does not apply because the context-managing code already ignored the keyword
    if ((node.name === "class" || node.name === "function") &&
      (this.lastTokEnd !== this.lastTokStart + 1 || this.input.charCodeAt(this.lastTokStart) !== 46)) {
      this.context.pop();
    }
  } else {
    this.unexpected();
  }
  return node
};

pp$5.parsePrivateIdent = function() {
  var node = this.startNode();
  if (this.type === types$1.privateId) {
    node.name = this.value;
  } else {
    this.unexpected();
  }
  this.next();
  this.finishNode(node, "PrivateIdentifier");

  // For validating existence
  if (this.options.checkPrivateFields) {
    if (this.privateNameStack.length === 0) {
      this.raise(node.start, ("Private field '#" + (node.name) + "' must be declared in an enclosing class"));
    } else {
      this.privateNameStack[this.privateNameStack.length - 1].used.push(node);
    }
  }

  return node
};

// Parses yield expression inside generator.

pp$5.parseYield = function(forInit) {
  if (!this.yieldPos) { this.yieldPos = this.start; }

  var node = this.startNode();
  this.next();
  if (this.type === types$1.semi || this.canInsertSemicolon() || (this.type !== types$1.star && !this.type.startsExpr)) {
    node.delegate = false;
    node.argument = null;
  } else {
    node.delegate = this.eat(types$1.star);
    node.argument = this.parseMaybeAssign(forInit);
  }
  return this.finishNode(node, "YieldExpression")
};

pp$5.parseAwait = function(forInit) {
  if (!this.awaitPos) { this.awaitPos = this.start; }

  var node = this.startNode();
  this.next();
  node.argument = this.parseMaybeUnary(null, true, false, forInit);
  return this.finishNode(node, "AwaitExpression")
};

var pp$4 = Parser.prototype;

// This function is used to raise exceptions on parse errors. It
// takes an offset integer (into the current `input`) to indicate
// the location of the error, attaches the position to the end
// of the error message, and then raises a `SyntaxError` with that
// message.

pp$4.raise = function(pos, message) {
  var loc = getLineInfo(this.input, pos);
  message += " (" + loc.line + ":" + loc.column + ")";
  var err = new SyntaxError(message);
  err.pos = pos; err.loc = loc; err.raisedAt = this.pos;
  throw err
};

pp$4.raiseRecoverable = pp$4.raise;

pp$4.curPosition = function() {
  if (this.options.locations) {
    return new Position(this.curLine, this.pos - this.lineStart)
  }
};

var pp$3 = Parser.prototype;

var Scope = function Scope(flags) {
  this.flags = flags;
  // A list of var-declared names in the current lexical scope
  this.var = [];
  // A list of lexically-declared names in the current lexical scope
  this.lexical = [];
  // A list of lexically-declared FunctionDeclaration names in the current lexical scope
  this.functions = [];
  // A switch to disallow the identifier reference 'arguments'
  this.inClassFieldInit = false;
};

// The functions in this module keep track of declared variables in the current scope in order to detect duplicate variable names.

pp$3.enterScope = function(flags) {
  this.scopeStack.push(new Scope(flags));
};

pp$3.exitScope = function() {
  this.scopeStack.pop();
};

// The spec says:
// > At the top level of a function, or script, function declarations are
// > treated like var declarations rather than like lexical declarations.
pp$3.treatFunctionsAsVarInScope = function(scope) {
  return (scope.flags & SCOPE_FUNCTION) || !this.inModule && (scope.flags & SCOPE_TOP)
};

pp$3.declareName = function(name, bindingType, pos) {
  var redeclared = false;
  if (bindingType === BIND_LEXICAL) {
    var scope = this.currentScope();
    redeclared = scope.lexical.indexOf(name) > -1 || scope.functions.indexOf(name) > -1 || scope.var.indexOf(name) > -1;
    scope.lexical.push(name);
    if (this.inModule && (scope.flags & SCOPE_TOP))
      { delete this.undefinedExports[name]; }
  } else if (bindingType === BIND_SIMPLE_CATCH) {
    var scope$1 = this.currentScope();
    scope$1.lexical.push(name);
  } else if (bindingType === BIND_FUNCTION) {
    var scope$2 = this.currentScope();
    if (this.treatFunctionsAsVar)
      { redeclared = scope$2.lexical.indexOf(name) > -1; }
    else
      { redeclared = scope$2.lexical.indexOf(name) > -1 || scope$2.var.indexOf(name) > -1; }
    scope$2.functions.push(name);
  } else {
    for (var i = this.scopeStack.length - 1; i >= 0; --i) {
      var scope$3 = this.scopeStack[i];
      if (scope$3.lexical.indexOf(name) > -1 && !((scope$3.flags & SCOPE_SIMPLE_CATCH) && scope$3.lexical[0] === name) ||
          !this.treatFunctionsAsVarInScope(scope$3) && scope$3.functions.indexOf(name) > -1) {
        redeclared = true;
        break
      }
      scope$3.var.push(name);
      if (this.inModule && (scope$3.flags & SCOPE_TOP))
        { delete this.undefinedExports[name]; }
      if (scope$3.flags & SCOPE_VAR) { break }
    }
  }
  if (redeclared) { this.raiseRecoverable(pos, ("Identifier '" + name + "' has already been declared")); }
};

pp$3.checkLocalExport = function(id) {
  // scope.functions must be empty as Module code is always strict.
  if (this.scopeStack[0].lexical.indexOf(id.name) === -1 &&
      this.scopeStack[0].var.indexOf(id.name) === -1) {
    this.undefinedExports[id.name] = id;
  }
};

pp$3.currentScope = function() {
  return this.scopeStack[this.scopeStack.length - 1]
};

pp$3.currentVarScope = function() {
  for (var i = this.scopeStack.length - 1;; i--) {
    var scope = this.scopeStack[i];
    if (scope.flags & SCOPE_VAR) { return scope }
  }
};

// Could be useful for `this`, `new.target`, `super()`, `super.property`, and `super[property]`.
pp$3.currentThisScope = function() {
  for (var i = this.scopeStack.length - 1;; i--) {
    var scope = this.scopeStack[i];
    if (scope.flags & SCOPE_VAR && !(scope.flags & SCOPE_ARROW)) { return scope }
  }
};

var Node = function Node(parser, pos, loc) {
  this.type = "";
  this.start = pos;
  this.end = 0;
  if (parser.options.locations)
    { this.loc = new SourceLocation(parser, loc); }
  if (parser.options.directSourceFile)
    { this.sourceFile = parser.options.directSourceFile; }
  if (parser.options.ranges)
    { this.range = [pos, 0]; }
};

// Start an AST node, attaching a start offset.

var pp$2 = Parser.prototype;

pp$2.startNode = function() {
  return new Node(this, this.start, this.startLoc)
};

pp$2.startNodeAt = function(pos, loc) {
  return new Node(this, pos, loc)
};

// Finish an AST node, adding `type` and `end` properties.

function finishNodeAt(node, type, pos, loc) {
  node.type = type;
  node.end = pos;
  if (this.options.locations)
    { node.loc.end = loc; }
  if (this.options.ranges)
    { node.range[1] = pos; }
  return node
}

pp$2.finishNode = function(node, type) {
  return finishNodeAt.call(this, node, type, this.lastTokEnd, this.lastTokEndLoc)
};

// Finish node at given position

pp$2.finishNodeAt = function(node, type, pos, loc) {
  return finishNodeAt.call(this, node, type, pos, loc)
};

pp$2.copyNode = function(node) {
  var newNode = new Node(this, node.start, this.startLoc);
  for (var prop in node) { newNode[prop] = node[prop]; }
  return newNode
};

// This file contains Unicode properties extracted from the ECMAScript specification.
// The lists are extracted like so:
// $$('#table-binary-unicode-properties > figure > table > tbody > tr > td:nth-child(1) code').map(el => el.innerText)

// #table-binary-unicode-properties
var ecma9BinaryProperties = "ASCII ASCII_Hex_Digit AHex Alphabetic Alpha Any Assigned Bidi_Control Bidi_C Bidi_Mirrored Bidi_M Case_Ignorable CI Cased Changes_When_Casefolded CWCF Changes_When_Casemapped CWCM Changes_When_Lowercased CWL Changes_When_NFKC_Casefolded CWKCF Changes_When_Titlecased CWT Changes_When_Uppercased CWU Dash Default_Ignorable_Code_Point DI Deprecated Dep Diacritic Dia Emoji Emoji_Component Emoji_Modifier Emoji_Modifier_Base Emoji_Presentation Extender Ext Grapheme_Base Gr_Base Grapheme_Extend Gr_Ext Hex_Digit Hex IDS_Binary_Operator IDSB IDS_Trinary_Operator IDST ID_Continue IDC ID_Start IDS Ideographic Ideo Join_Control Join_C Logical_Order_Exception LOE Lowercase Lower Math Noncharacter_Code_Point NChar Pattern_Syntax Pat_Syn Pattern_White_Space Pat_WS Quotation_Mark QMark Radical Regional_Indicator RI Sentence_Terminal STerm Soft_Dotted SD Terminal_Punctuation Term Unified_Ideograph UIdeo Uppercase Upper Variation_Selector VS White_Space space XID_Continue XIDC XID_Start XIDS";
var ecma10BinaryProperties = ecma9BinaryProperties + " Extended_Pictographic";
var ecma11BinaryProperties = ecma10BinaryProperties;
var ecma12BinaryProperties = ecma11BinaryProperties + " EBase EComp EMod EPres ExtPict";
var ecma13BinaryProperties = ecma12BinaryProperties;
var ecma14BinaryProperties = ecma13BinaryProperties;

var unicodeBinaryProperties = {
  9: ecma9BinaryProperties,
  10: ecma10BinaryProperties,
  11: ecma11BinaryProperties,
  12: ecma12BinaryProperties,
  13: ecma13BinaryProperties,
  14: ecma14BinaryProperties
};

// #table-binary-unicode-properties-of-strings
var ecma14BinaryPropertiesOfStrings = "Basic_Emoji Emoji_Keycap_Sequence RGI_Emoji_Modifier_Sequence RGI_Emoji_Flag_Sequence RGI_Emoji_Tag_Sequence RGI_Emoji_ZWJ_Sequence RGI_Emoji";

var unicodeBinaryPropertiesOfStrings = {
  9: "",
  10: "",
  11: "",
  12: "",
  13: "",
  14: ecma14BinaryPropertiesOfStrings
};

// #table-unicode-general-category-values
var unicodeGeneralCategoryValues = "Cased_Letter LC Close_Punctuation Pe Connector_Punctuation Pc Control Cc cntrl Currency_Symbol Sc Dash_Punctuation Pd Decimal_Number Nd digit Enclosing_Mark Me Final_Punctuation Pf Format Cf Initial_Punctuation Pi Letter L Letter_Number Nl Line_Separator Zl Lowercase_Letter Ll Mark M Combining_Mark Math_Symbol Sm Modifier_Letter Lm Modifier_Symbol Sk Nonspacing_Mark Mn Number N Open_Punctuation Ps Other C Other_Letter Lo Other_Number No Other_Punctuation Po Other_Symbol So Paragraph_Separator Zp Private_Use Co Punctuation P punct Separator Z Space_Separator Zs Spacing_Mark Mc Surrogate Cs Symbol S Titlecase_Letter Lt Unassigned Cn Uppercase_Letter Lu";

// #table-unicode-script-values
var ecma9ScriptValues = "Adlam Adlm Ahom Anatolian_Hieroglyphs Hluw Arabic Arab Armenian Armn Avestan Avst Balinese Bali Bamum Bamu Bassa_Vah Bass Batak Batk Bengali Beng Bhaiksuki Bhks Bopomofo Bopo Brahmi Brah Braille Brai Buginese Bugi Buhid Buhd Canadian_Aboriginal Cans Carian Cari Caucasian_Albanian Aghb Chakma Cakm Cham Cham Cherokee Cher Common Zyyy Coptic Copt Qaac Cuneiform Xsux Cypriot Cprt Cyrillic Cyrl Deseret Dsrt Devanagari Deva Duployan Dupl Egyptian_Hieroglyphs Egyp Elbasan Elba Ethiopic Ethi Georgian Geor Glagolitic Glag Gothic Goth Grantha Gran Greek Grek Gujarati Gujr Gurmukhi Guru Han Hani Hangul Hang Hanunoo Hano Hatran Hatr Hebrew Hebr Hiragana Hira Imperial_Aramaic Armi Inherited Zinh Qaai Inscriptional_Pahlavi Phli Inscriptional_Parthian Prti Javanese Java Kaithi Kthi Kannada Knda Katakana Kana Kayah_Li Kali Kharoshthi Khar Khmer Khmr Khojki Khoj Khudawadi Sind Lao Laoo Latin Latn Lepcha Lepc Limbu Limb Linear_A Lina Linear_B Linb Lisu Lisu Lycian Lyci Lydian Lydi Mahajani Mahj Malayalam Mlym Mandaic Mand Manichaean Mani Marchen Marc Masaram_Gondi Gonm Meetei_Mayek Mtei Mende_Kikakui Mend Meroitic_Cursive Merc Meroitic_Hieroglyphs Mero Miao Plrd Modi Mongolian Mong Mro Mroo Multani Mult Myanmar Mymr Nabataean Nbat New_Tai_Lue Talu Newa Newa Nko Nkoo Nushu Nshu Ogham Ogam Ol_Chiki Olck Old_Hungarian Hung Old_Italic Ital Old_North_Arabian Narb Old_Permic Perm Old_Persian Xpeo Old_South_Arabian Sarb Old_Turkic Orkh Oriya Orya Osage Osge Osmanya Osma Pahawh_Hmong Hmng Palmyrene Palm Pau_Cin_Hau Pauc Phags_Pa Phag Phoenician Phnx Psalter_Pahlavi Phlp Rejang Rjng Runic Runr Samaritan Samr Saurashtra Saur Sharada Shrd Shavian Shaw Siddham Sidd SignWriting Sgnw Sinhala Sinh Sora_Sompeng Sora Soyombo Soyo Sundanese Sund Syloti_Nagri Sylo Syriac Syrc Tagalog Tglg Tagbanwa Tagb Tai_Le Tale Tai_Tham Lana Tai_Viet Tavt Takri Takr Tamil Taml Tangut Tang Telugu Telu Thaana Thaa Thai Thai Tibetan Tibt Tifinagh Tfng Tirhuta Tirh Ugaritic Ugar Vai Vaii Warang_Citi Wara Yi Yiii Zanabazar_Square Zanb";
var ecma10ScriptValues = ecma9ScriptValues + " Dogra Dogr Gunjala_Gondi Gong Hanifi_Rohingya Rohg Makasar Maka Medefaidrin Medf Old_Sogdian Sogo Sogdian Sogd";
var ecma11ScriptValues = ecma10ScriptValues + " Elymaic Elym Nandinagari Nand Nyiakeng_Puachue_Hmong Hmnp Wancho Wcho";
var ecma12ScriptValues = ecma11ScriptValues + " Chorasmian Chrs Diak Dives_Akuru Khitan_Small_Script Kits Yezi Yezidi";
var ecma13ScriptValues = ecma12ScriptValues + " Cypro_Minoan Cpmn Old_Uyghur Ougr Tangsa Tnsa Toto Vithkuqi Vith";
var ecma14ScriptValues = ecma13ScriptValues + " Hrkt Katakana_Or_Hiragana Kawi Nag_Mundari Nagm Unknown Zzzz";

var unicodeScriptValues = {
  9: ecma9ScriptValues,
  10: ecma10ScriptValues,
  11: ecma11ScriptValues,
  12: ecma12ScriptValues,
  13: ecma13ScriptValues,
  14: ecma14ScriptValues
};

var data = {};
function buildUnicodeData(ecmaVersion) {
  var d = data[ecmaVersion] = {
    binary: wordsRegexp(unicodeBinaryProperties[ecmaVersion] + " " + unicodeGeneralCategoryValues),
    binaryOfStrings: wordsRegexp(unicodeBinaryPropertiesOfStrings[ecmaVersion]),
    nonBinary: {
      General_Category: wordsRegexp(unicodeGeneralCategoryValues),
      Script: wordsRegexp(unicodeScriptValues[ecmaVersion])
    }
  };
  d.nonBinary.Script_Extensions = d.nonBinary.Script;

  d.nonBinary.gc = d.nonBinary.General_Category;
  d.nonBinary.sc = d.nonBinary.Script;
  d.nonBinary.scx = d.nonBinary.Script_Extensions;
}

for (var i = 0, list = [9, 10, 11, 12, 13, 14]; i < list.length; i += 1) {
  var ecmaVersion = list[i];

  buildUnicodeData(ecmaVersion);
}

var pp$1 = Parser.prototype;

var RegExpValidationState = function RegExpValidationState(parser) {
  this.parser = parser;
  this.validFlags = "gim" + (parser.options.ecmaVersion >= 6 ? "uy" : "") + (parser.options.ecmaVersion >= 9 ? "s" : "") + (parser.options.ecmaVersion >= 13 ? "d" : "") + (parser.options.ecmaVersion >= 15 ? "v" : "");
  this.unicodeProperties = data[parser.options.ecmaVersion >= 14 ? 14 : parser.options.ecmaVersion];
  this.source = "";
  this.flags = "";
  this.start = 0;
  this.switchU = false;
  this.switchV = false;
  this.switchN = false;
  this.pos = 0;
  this.lastIntValue = 0;
  this.lastStringValue = "";
  this.lastAssertionIsQuantifiable = false;
  this.numCapturingParens = 0;
  this.maxBackReference = 0;
  this.groupNames = [];
  this.backReferenceNames = [];
};

RegExpValidationState.prototype.reset = function reset (start, pattern, flags) {
  var unicodeSets = flags.indexOf("v") !== -1;
  var unicode = flags.indexOf("u") !== -1;
  this.start = start | 0;
  this.source = pattern + "";
  this.flags = flags;
  if (unicodeSets && this.parser.options.ecmaVersion >= 15) {
    this.switchU = true;
    this.switchV = true;
    this.switchN = true;
  } else {
    this.switchU = unicode && this.parser.options.ecmaVersion >= 6;
    this.switchV = false;
    this.switchN = unicode && this.parser.options.ecmaVersion >= 9;
  }
};

RegExpValidationState.prototype.raise = function raise (message) {
  this.parser.raiseRecoverable(this.start, ("Invalid regular expression: /" + (this.source) + "/: " + message));
};

// If u flag is given, this returns the code point at the index (it combines a surrogate pair).
// Otherwise, this returns the code unit of the index (can be a part of a surrogate pair).
RegExpValidationState.prototype.at = function at (i, forceU) {
    if ( forceU === void 0 ) forceU = false;

  var s = this.source;
  var l = s.length;
  if (i >= l) {
    return -1
  }
  var c = s.charCodeAt(i);
  if (!(forceU || this.switchU) || c <= 0xD7FF || c >= 0xE000 || i + 1 >= l) {
    return c
  }
  var next = s.charCodeAt(i + 1);
  return next >= 0xDC00 && next <= 0xDFFF ? (c << 10) + next - 0x35FDC00 : c
};

RegExpValidationState.prototype.nextIndex = function nextIndex (i, forceU) {
    if ( forceU === void 0 ) forceU = false;

  var s = this.source;
  var l = s.length;
  if (i >= l) {
    return l
  }
  var c = s.charCodeAt(i), next;
  if (!(forceU || this.switchU) || c <= 0xD7FF || c >= 0xE000 || i + 1 >= l ||
      (next = s.charCodeAt(i + 1)) < 0xDC00 || next > 0xDFFF) {
    return i + 1
  }
  return i + 2
};

RegExpValidationState.prototype.current = function current (forceU) {
    if ( forceU === void 0 ) forceU = false;

  return this.at(this.pos, forceU)
};

RegExpValidationState.prototype.lookahead = function lookahead (forceU) {
    if ( forceU === void 0 ) forceU = false;

  return this.at(this.nextIndex(this.pos, forceU), forceU)
};

RegExpValidationState.prototype.advance = function advance (forceU) {
    if ( forceU === void 0 ) forceU = false;

  this.pos = this.nextIndex(this.pos, forceU);
};

RegExpValidationState.prototype.eat = function eat (ch, forceU) {
    if ( forceU === void 0 ) forceU = false;

  if (this.current(forceU) === ch) {
    this.advance(forceU);
    return true
  }
  return false
};

RegExpValidationState.prototype.eatChars = function eatChars (chs, forceU) {
    if ( forceU === void 0 ) forceU = false;

  var pos = this.pos;
  for (var i = 0, list = chs; i < list.length; i += 1) {
    var ch = list[i];

      var current = this.at(pos, forceU);
    if (current === -1 || current !== ch) {
      return false
    }
    pos = this.nextIndex(pos, forceU);
  }
  this.pos = pos;
  return true
};

/**
 * Validate the flags part of a given RegExpLiteral.
 *
 * @param {RegExpValidationState} state The state to validate RegExp.
 * @returns {void}
 */
pp$1.validateRegExpFlags = function(state) {
  var validFlags = state.validFlags;
  var flags = state.flags;

  var u = false;
  var v = false;

  for (var i = 0; i < flags.length; i++) {
    var flag = flags.charAt(i);
    if (validFlags.indexOf(flag) === -1) {
      this.raise(state.start, "Invalid regular expression flag");
    }
    if (flags.indexOf(flag, i + 1) > -1) {
      this.raise(state.start, "Duplicate regular expression flag");
    }
    if (flag === "u") { u = true; }
    if (flag === "v") { v = true; }
  }
  if (this.options.ecmaVersion >= 15 && u && v) {
    this.raise(state.start, "Invalid regular expression flag");
  }
};

/**
 * Validate the pattern part of a given RegExpLiteral.
 *
 * @param {RegExpValidationState} state The state to validate RegExp.
 * @returns {void}
 */
pp$1.validateRegExpPattern = function(state) {
  this.regexp_pattern(state);

  // The goal symbol for the parse is |Pattern[~U, ~N]|. If the result of
  // parsing contains a |GroupName|, reparse with the goal symbol
  // |Pattern[~U, +N]| and use this result instead. Throw a *SyntaxError*
  // exception if _P_ did not conform to the grammar, if any elements of _P_
  // were not matched by the parse, or if any Early Error conditions exist.
  if (!state.switchN && this.options.ecmaVersion >= 9 && state.groupNames.length > 0) {
    state.switchN = true;
    this.regexp_pattern(state);
  }
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-Pattern
pp$1.regexp_pattern = function(state) {
  state.pos = 0;
  state.lastIntValue = 0;
  state.lastStringValue = "";
  state.lastAssertionIsQuantifiable = false;
  state.numCapturingParens = 0;
  state.maxBackReference = 0;
  state.groupNames.length = 0;
  state.backReferenceNames.length = 0;

  this.regexp_disjunction(state);

  if (state.pos !== state.source.length) {
    // Make the same messages as V8.
    if (state.eat(0x29 /* ) */)) {
      state.raise("Unmatched ')'");
    }
    if (state.eat(0x5D /* ] */) || state.eat(0x7D /* } */)) {
      state.raise("Lone quantifier brackets");
    }
  }
  if (state.maxBackReference > state.numCapturingParens) {
    state.raise("Invalid escape");
  }
  for (var i = 0, list = state.backReferenceNames; i < list.length; i += 1) {
    var name = list[i];

    if (state.groupNames.indexOf(name) === -1) {
      state.raise("Invalid named capture referenced");
    }
  }
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-Disjunction
pp$1.regexp_disjunction = function(state) {
  this.regexp_alternative(state);
  while (state.eat(0x7C /* | */)) {
    this.regexp_alternative(state);
  }

  // Make the same message as V8.
  if (this.regexp_eatQuantifier(state, true)) {
    state.raise("Nothing to repeat");
  }
  if (state.eat(0x7B /* { */)) {
    state.raise("Lone quantifier brackets");
  }
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-Alternative
pp$1.regexp_alternative = function(state) {
  while (state.pos < state.source.length && this.regexp_eatTerm(state))
    { }
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-Term
pp$1.regexp_eatTerm = function(state) {
  if (this.regexp_eatAssertion(state)) {
    // Handle `QuantifiableAssertion Quantifier` alternative.
    // `state.lastAssertionIsQuantifiable` is true if the last eaten Assertion
    // is a QuantifiableAssertion.
    if (state.lastAssertionIsQuantifiable && this.regexp_eatQuantifier(state)) {
      // Make the same message as V8.
      if (state.switchU) {
        state.raise("Invalid quantifier");
      }
    }
    return true
  }

  if (state.switchU ? this.regexp_eatAtom(state) : this.regexp_eatExtendedAtom(state)) {
    this.regexp_eatQuantifier(state);
    return true
  }

  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-Assertion
pp$1.regexp_eatAssertion = function(state) {
  var start = state.pos;
  state.lastAssertionIsQuantifiable = false;

  // ^, $
  if (state.eat(0x5E /* ^ */) || state.eat(0x24 /* $ */)) {
    return true
  }

  // \b \B
  if (state.eat(0x5C /* \ */)) {
    if (state.eat(0x42 /* B */) || state.eat(0x62 /* b */)) {
      return true
    }
    state.pos = start;
  }

  // Lookahead / Lookbehind
  if (state.eat(0x28 /* ( */) && state.eat(0x3F /* ? */)) {
    var lookbehind = false;
    if (this.options.ecmaVersion >= 9) {
      lookbehind = state.eat(0x3C /* < */);
    }
    if (state.eat(0x3D /* = */) || state.eat(0x21 /* ! */)) {
      this.regexp_disjunction(state);
      if (!state.eat(0x29 /* ) */)) {
        state.raise("Unterminated group");
      }
      state.lastAssertionIsQuantifiable = !lookbehind;
      return true
    }
  }

  state.pos = start;
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-Quantifier
pp$1.regexp_eatQuantifier = function(state, noError) {
  if ( noError === void 0 ) noError = false;

  if (this.regexp_eatQuantifierPrefix(state, noError)) {
    state.eat(0x3F /* ? */);
    return true
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-QuantifierPrefix
pp$1.regexp_eatQuantifierPrefix = function(state, noError) {
  return (
    state.eat(0x2A /* * */) ||
    state.eat(0x2B /* + */) ||
    state.eat(0x3F /* ? */) ||
    this.regexp_eatBracedQuantifier(state, noError)
  )
};
pp$1.regexp_eatBracedQuantifier = function(state, noError) {
  var start = state.pos;
  if (state.eat(0x7B /* { */)) {
    var min = 0, max = -1;
    if (this.regexp_eatDecimalDigits(state)) {
      min = state.lastIntValue;
      if (state.eat(0x2C /* , */) && this.regexp_eatDecimalDigits(state)) {
        max = state.lastIntValue;
      }
      if (state.eat(0x7D /* } */)) {
        // SyntaxError in https://www.ecma-international.org/ecma-262/8.0/#sec-term
        if (max !== -1 && max < min && !noError) {
          state.raise("numbers out of order in {} quantifier");
        }
        return true
      }
    }
    if (state.switchU && !noError) {
      state.raise("Incomplete quantifier");
    }
    state.pos = start;
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-Atom
pp$1.regexp_eatAtom = function(state) {
  return (
    this.regexp_eatPatternCharacters(state) ||
    state.eat(0x2E /* . */) ||
    this.regexp_eatReverseSolidusAtomEscape(state) ||
    this.regexp_eatCharacterClass(state) ||
    this.regexp_eatUncapturingGroup(state) ||
    this.regexp_eatCapturingGroup(state)
  )
};
pp$1.regexp_eatReverseSolidusAtomEscape = function(state) {
  var start = state.pos;
  if (state.eat(0x5C /* \ */)) {
    if (this.regexp_eatAtomEscape(state)) {
      return true
    }
    state.pos = start;
  }
  return false
};
pp$1.regexp_eatUncapturingGroup = function(state) {
  var start = state.pos;
  if (state.eat(0x28 /* ( */)) {
    if (state.eat(0x3F /* ? */) && state.eat(0x3A /* : */)) {
      this.regexp_disjunction(state);
      if (state.eat(0x29 /* ) */)) {
        return true
      }
      state.raise("Unterminated group");
    }
    state.pos = start;
  }
  return false
};
pp$1.regexp_eatCapturingGroup = function(state) {
  if (state.eat(0x28 /* ( */)) {
    if (this.options.ecmaVersion >= 9) {
      this.regexp_groupSpecifier(state);
    } else if (state.current() === 0x3F /* ? */) {
      state.raise("Invalid group");
    }
    this.regexp_disjunction(state);
    if (state.eat(0x29 /* ) */)) {
      state.numCapturingParens += 1;
      return true
    }
    state.raise("Unterminated group");
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-ExtendedAtom
pp$1.regexp_eatExtendedAtom = function(state) {
  return (
    state.eat(0x2E /* . */) ||
    this.regexp_eatReverseSolidusAtomEscape(state) ||
    this.regexp_eatCharacterClass(state) ||
    this.regexp_eatUncapturingGroup(state) ||
    this.regexp_eatCapturingGroup(state) ||
    this.regexp_eatInvalidBracedQuantifier(state) ||
    this.regexp_eatExtendedPatternCharacter(state)
  )
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-InvalidBracedQuantifier
pp$1.regexp_eatInvalidBracedQuantifier = function(state) {
  if (this.regexp_eatBracedQuantifier(state, true)) {
    state.raise("Nothing to repeat");
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-SyntaxCharacter
pp$1.regexp_eatSyntaxCharacter = function(state) {
  var ch = state.current();
  if (isSyntaxCharacter(ch)) {
    state.lastIntValue = ch;
    state.advance();
    return true
  }
  return false
};
function isSyntaxCharacter(ch) {
  return (
    ch === 0x24 /* $ */ ||
    ch >= 0x28 /* ( */ && ch <= 0x2B /* + */ ||
    ch === 0x2E /* . */ ||
    ch === 0x3F /* ? */ ||
    ch >= 0x5B /* [ */ && ch <= 0x5E /* ^ */ ||
    ch >= 0x7B /* { */ && ch <= 0x7D /* } */
  )
}

// https://www.ecma-international.org/ecma-262/8.0/#prod-PatternCharacter
// But eat eager.
pp$1.regexp_eatPatternCharacters = function(state) {
  var start = state.pos;
  var ch = 0;
  while ((ch = state.current()) !== -1 && !isSyntaxCharacter(ch)) {
    state.advance();
  }
  return state.pos !== start
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-ExtendedPatternCharacter
pp$1.regexp_eatExtendedPatternCharacter = function(state) {
  var ch = state.current();
  if (
    ch !== -1 &&
    ch !== 0x24 /* $ */ &&
    !(ch >= 0x28 /* ( */ && ch <= 0x2B /* + */) &&
    ch !== 0x2E /* . */ &&
    ch !== 0x3F /* ? */ &&
    ch !== 0x5B /* [ */ &&
    ch !== 0x5E /* ^ */ &&
    ch !== 0x7C /* | */
  ) {
    state.advance();
    return true
  }
  return false
};

// GroupSpecifier ::
//   [empty]
//   `?` GroupName
pp$1.regexp_groupSpecifier = function(state) {
  if (state.eat(0x3F /* ? */)) {
    if (this.regexp_eatGroupName(state)) {
      if (state.groupNames.indexOf(state.lastStringValue) !== -1) {
        state.raise("Duplicate capture group name");
      }
      state.groupNames.push(state.lastStringValue);
      return
    }
    state.raise("Invalid group");
  }
};

// GroupName ::
//   `<` RegExpIdentifierName `>`
// Note: this updates `state.lastStringValue` property with the eaten name.
pp$1.regexp_eatGroupName = function(state) {
  state.lastStringValue = "";
  if (state.eat(0x3C /* < */)) {
    if (this.regexp_eatRegExpIdentifierName(state) && state.eat(0x3E /* > */)) {
      return true
    }
    state.raise("Invalid capture group name");
  }
  return false
};

// RegExpIdentifierName ::
//   RegExpIdentifierStart
//   RegExpIdentifierName RegExpIdentifierPart
// Note: this updates `state.lastStringValue` property with the eaten name.
pp$1.regexp_eatRegExpIdentifierName = function(state) {
  state.lastStringValue = "";
  if (this.regexp_eatRegExpIdentifierStart(state)) {
    state.lastStringValue += codePointToString(state.lastIntValue);
    while (this.regexp_eatRegExpIdentifierPart(state)) {
      state.lastStringValue += codePointToString(state.lastIntValue);
    }
    return true
  }
  return false
};

// RegExpIdentifierStart ::
//   UnicodeIDStart
//   `$`
//   `_`
//   `\` RegExpUnicodeEscapeSequence[+U]
pp$1.regexp_eatRegExpIdentifierStart = function(state) {
  var start = state.pos;
  var forceU = this.options.ecmaVersion >= 11;
  var ch = state.current(forceU);
  state.advance(forceU);

  if (ch === 0x5C /* \ */ && this.regexp_eatRegExpUnicodeEscapeSequence(state, forceU)) {
    ch = state.lastIntValue;
  }
  if (isRegExpIdentifierStart(ch)) {
    state.lastIntValue = ch;
    return true
  }

  state.pos = start;
  return false
};
function isRegExpIdentifierStart(ch) {
  return isIdentifierStart(ch, true) || ch === 0x24 /* $ */ || ch === 0x5F /* _ */
}

// RegExpIdentifierPart ::
//   UnicodeIDContinue
//   `$`
//   `_`
//   `\` RegExpUnicodeEscapeSequence[+U]
//   <ZWNJ>
//   <ZWJ>
pp$1.regexp_eatRegExpIdentifierPart = function(state) {
  var start = state.pos;
  var forceU = this.options.ecmaVersion >= 11;
  var ch = state.current(forceU);
  state.advance(forceU);

  if (ch === 0x5C /* \ */ && this.regexp_eatRegExpUnicodeEscapeSequence(state, forceU)) {
    ch = state.lastIntValue;
  }
  if (isRegExpIdentifierPart(ch)) {
    state.lastIntValue = ch;
    return true
  }

  state.pos = start;
  return false
};
function isRegExpIdentifierPart(ch) {
  return isIdentifierChar(ch, true) || ch === 0x24 /* $ */ || ch === 0x5F /* _ */ || ch === 0x200C /* <ZWNJ> */ || ch === 0x200D /* <ZWJ> */
}

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-AtomEscape
pp$1.regexp_eatAtomEscape = function(state) {
  if (
    this.regexp_eatBackReference(state) ||
    this.regexp_eatCharacterClassEscape(state) ||
    this.regexp_eatCharacterEscape(state) ||
    (state.switchN && this.regexp_eatKGroupName(state))
  ) {
    return true
  }
  if (state.switchU) {
    // Make the same message as V8.
    if (state.current() === 0x63 /* c */) {
      state.raise("Invalid unicode escape");
    }
    state.raise("Invalid escape");
  }
  return false
};
pp$1.regexp_eatBackReference = function(state) {
  var start = state.pos;
  if (this.regexp_eatDecimalEscape(state)) {
    var n = state.lastIntValue;
    if (state.switchU) {
      // For SyntaxError in https://www.ecma-international.org/ecma-262/8.0/#sec-atomescape
      if (n > state.maxBackReference) {
        state.maxBackReference = n;
      }
      return true
    }
    if (n <= state.numCapturingParens) {
      return true
    }
    state.pos = start;
  }
  return false
};
pp$1.regexp_eatKGroupName = function(state) {
  if (state.eat(0x6B /* k */)) {
    if (this.regexp_eatGroupName(state)) {
      state.backReferenceNames.push(state.lastStringValue);
      return true
    }
    state.raise("Invalid named reference");
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-CharacterEscape
pp$1.regexp_eatCharacterEscape = function(state) {
  return (
    this.regexp_eatControlEscape(state) ||
    this.regexp_eatCControlLetter(state) ||
    this.regexp_eatZero(state) ||
    this.regexp_eatHexEscapeSequence(state) ||
    this.regexp_eatRegExpUnicodeEscapeSequence(state, false) ||
    (!state.switchU && this.regexp_eatLegacyOctalEscapeSequence(state)) ||
    this.regexp_eatIdentityEscape(state)
  )
};
pp$1.regexp_eatCControlLetter = function(state) {
  var start = state.pos;
  if (state.eat(0x63 /* c */)) {
    if (this.regexp_eatControlLetter(state)) {
      return true
    }
    state.pos = start;
  }
  return false
};
pp$1.regexp_eatZero = function(state) {
  if (state.current() === 0x30 /* 0 */ && !isDecimalDigit(state.lookahead())) {
    state.lastIntValue = 0;
    state.advance();
    return true
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-ControlEscape
pp$1.regexp_eatControlEscape = function(state) {
  var ch = state.current();
  if (ch === 0x74 /* t */) {
    state.lastIntValue = 0x09; /* \t */
    state.advance();
    return true
  }
  if (ch === 0x6E /* n */) {
    state.lastIntValue = 0x0A; /* \n */
    state.advance();
    return true
  }
  if (ch === 0x76 /* v */) {
    state.lastIntValue = 0x0B; /* \v */
    state.advance();
    return true
  }
  if (ch === 0x66 /* f */) {
    state.lastIntValue = 0x0C; /* \f */
    state.advance();
    return true
  }
  if (ch === 0x72 /* r */) {
    state.lastIntValue = 0x0D; /* \r */
    state.advance();
    return true
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-ControlLetter
pp$1.regexp_eatControlLetter = function(state) {
  var ch = state.current();
  if (isControlLetter(ch)) {
    state.lastIntValue = ch % 0x20;
    state.advance();
    return true
  }
  return false
};
function isControlLetter(ch) {
  return (
    (ch >= 0x41 /* A */ && ch <= 0x5A /* Z */) ||
    (ch >= 0x61 /* a */ && ch <= 0x7A /* z */)
  )
}

// https://www.ecma-international.org/ecma-262/8.0/#prod-RegExpUnicodeEscapeSequence
pp$1.regexp_eatRegExpUnicodeEscapeSequence = function(state, forceU) {
  if ( forceU === void 0 ) forceU = false;

  var start = state.pos;
  var switchU = forceU || state.switchU;

  if (state.eat(0x75 /* u */)) {
    if (this.regexp_eatFixedHexDigits(state, 4)) {
      var lead = state.lastIntValue;
      if (switchU && lead >= 0xD800 && lead <= 0xDBFF) {
        var leadSurrogateEnd = state.pos;
        if (state.eat(0x5C /* \ */) && state.eat(0x75 /* u */) && this.regexp_eatFixedHexDigits(state, 4)) {
          var trail = state.lastIntValue;
          if (trail >= 0xDC00 && trail <= 0xDFFF) {
            state.lastIntValue = (lead - 0xD800) * 0x400 + (trail - 0xDC00) + 0x10000;
            return true
          }
        }
        state.pos = leadSurrogateEnd;
        state.lastIntValue = lead;
      }
      return true
    }
    if (
      switchU &&
      state.eat(0x7B /* { */) &&
      this.regexp_eatHexDigits(state) &&
      state.eat(0x7D /* } */) &&
      isValidUnicode(state.lastIntValue)
    ) {
      return true
    }
    if (switchU) {
      state.raise("Invalid unicode escape");
    }
    state.pos = start;
  }

  return false
};
function isValidUnicode(ch) {
  return ch >= 0 && ch <= 0x10FFFF
}

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-IdentityEscape
pp$1.regexp_eatIdentityEscape = function(state) {
  if (state.switchU) {
    if (this.regexp_eatSyntaxCharacter(state)) {
      return true
    }
    if (state.eat(0x2F /* / */)) {
      state.lastIntValue = 0x2F; /* / */
      return true
    }
    return false
  }

  var ch = state.current();
  if (ch !== 0x63 /* c */ && (!state.switchN || ch !== 0x6B /* k */)) {
    state.lastIntValue = ch;
    state.advance();
    return true
  }

  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-DecimalEscape
pp$1.regexp_eatDecimalEscape = function(state) {
  state.lastIntValue = 0;
  var ch = state.current();
  if (ch >= 0x31 /* 1 */ && ch <= 0x39 /* 9 */) {
    do {
      state.lastIntValue = 10 * state.lastIntValue + (ch - 0x30 /* 0 */);
      state.advance();
    } while ((ch = state.current()) >= 0x30 /* 0 */ && ch <= 0x39 /* 9 */)
    return true
  }
  return false
};

// Return values used by character set parsing methods, needed to
// forbid negation of sets that can match strings.
var CharSetNone = 0; // Nothing parsed
var CharSetOk = 1; // Construct parsed, cannot contain strings
var CharSetString = 2; // Construct parsed, can contain strings

// https://www.ecma-international.org/ecma-262/8.0/#prod-CharacterClassEscape
pp$1.regexp_eatCharacterClassEscape = function(state) {
  var ch = state.current();

  if (isCharacterClassEscape(ch)) {
    state.lastIntValue = -1;
    state.advance();
    return CharSetOk
  }

  var negate = false;
  if (
    state.switchU &&
    this.options.ecmaVersion >= 9 &&
    ((negate = ch === 0x50 /* P */) || ch === 0x70 /* p */)
  ) {
    state.lastIntValue = -1;
    state.advance();
    var result;
    if (
      state.eat(0x7B /* { */) &&
      (result = this.regexp_eatUnicodePropertyValueExpression(state)) &&
      state.eat(0x7D /* } */)
    ) {
      if (negate && result === CharSetString) { state.raise("Invalid property name"); }
      return result
    }
    state.raise("Invalid property name");
  }

  return CharSetNone
};

function isCharacterClassEscape(ch) {
  return (
    ch === 0x64 /* d */ ||
    ch === 0x44 /* D */ ||
    ch === 0x73 /* s */ ||
    ch === 0x53 /* S */ ||
    ch === 0x77 /* w */ ||
    ch === 0x57 /* W */
  )
}

// UnicodePropertyValueExpression ::
//   UnicodePropertyName `=` UnicodePropertyValue
//   LoneUnicodePropertyNameOrValue
pp$1.regexp_eatUnicodePropertyValueExpression = function(state) {
  var start = state.pos;

  // UnicodePropertyName `=` UnicodePropertyValue
  if (this.regexp_eatUnicodePropertyName(state) && state.eat(0x3D /* = */)) {
    var name = state.lastStringValue;
    if (this.regexp_eatUnicodePropertyValue(state)) {
      var value = state.lastStringValue;
      this.regexp_validateUnicodePropertyNameAndValue(state, name, value);
      return CharSetOk
    }
  }
  state.pos = start;

  // LoneUnicodePropertyNameOrValue
  if (this.regexp_eatLoneUnicodePropertyNameOrValue(state)) {
    var nameOrValue = state.lastStringValue;
    return this.regexp_validateUnicodePropertyNameOrValue(state, nameOrValue)
  }
  return CharSetNone
};

pp$1.regexp_validateUnicodePropertyNameAndValue = function(state, name, value) {
  if (!hasOwn(state.unicodeProperties.nonBinary, name))
    { state.raise("Invalid property name"); }
  if (!state.unicodeProperties.nonBinary[name].test(value))
    { state.raise("Invalid property value"); }
};

pp$1.regexp_validateUnicodePropertyNameOrValue = function(state, nameOrValue) {
  if (state.unicodeProperties.binary.test(nameOrValue)) { return CharSetOk }
  if (state.switchV && state.unicodeProperties.binaryOfStrings.test(nameOrValue)) { return CharSetString }
  state.raise("Invalid property name");
};

// UnicodePropertyName ::
//   UnicodePropertyNameCharacters
pp$1.regexp_eatUnicodePropertyName = function(state) {
  var ch = 0;
  state.lastStringValue = "";
  while (isUnicodePropertyNameCharacter(ch = state.current())) {
    state.lastStringValue += codePointToString(ch);
    state.advance();
  }
  return state.lastStringValue !== ""
};

function isUnicodePropertyNameCharacter(ch) {
  return isControlLetter(ch) || ch === 0x5F /* _ */
}

// UnicodePropertyValue ::
//   UnicodePropertyValueCharacters
pp$1.regexp_eatUnicodePropertyValue = function(state) {
  var ch = 0;
  state.lastStringValue = "";
  while (isUnicodePropertyValueCharacter(ch = state.current())) {
    state.lastStringValue += codePointToString(ch);
    state.advance();
  }
  return state.lastStringValue !== ""
};
function isUnicodePropertyValueCharacter(ch) {
  return isUnicodePropertyNameCharacter(ch) || isDecimalDigit(ch)
}

// LoneUnicodePropertyNameOrValue ::
//   UnicodePropertyValueCharacters
pp$1.regexp_eatLoneUnicodePropertyNameOrValue = function(state) {
  return this.regexp_eatUnicodePropertyValue(state)
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-CharacterClass
pp$1.regexp_eatCharacterClass = function(state) {
  if (state.eat(0x5B /* [ */)) {
    var negate = state.eat(0x5E /* ^ */);
    var result = this.regexp_classContents(state);
    if (!state.eat(0x5D /* ] */))
      { state.raise("Unterminated character class"); }
    if (negate && result === CharSetString)
      { state.raise("Negated character class may contain strings"); }
    return true
  }
  return false
};

// https://tc39.es/ecma262/#prod-ClassContents
// https://www.ecma-international.org/ecma-262/8.0/#prod-ClassRanges
pp$1.regexp_classContents = function(state) {
  if (state.current() === 0x5D /* ] */) { return CharSetOk }
  if (state.switchV) { return this.regexp_classSetExpression(state) }
  this.regexp_nonEmptyClassRanges(state);
  return CharSetOk
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-NonemptyClassRanges
// https://www.ecma-international.org/ecma-262/8.0/#prod-NonemptyClassRangesNoDash
pp$1.regexp_nonEmptyClassRanges = function(state) {
  while (this.regexp_eatClassAtom(state)) {
    var left = state.lastIntValue;
    if (state.eat(0x2D /* - */) && this.regexp_eatClassAtom(state)) {
      var right = state.lastIntValue;
      if (state.switchU && (left === -1 || right === -1)) {
        state.raise("Invalid character class");
      }
      if (left !== -1 && right !== -1 && left > right) {
        state.raise("Range out of order in character class");
      }
    }
  }
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-ClassAtom
// https://www.ecma-international.org/ecma-262/8.0/#prod-ClassAtomNoDash
pp$1.regexp_eatClassAtom = function(state) {
  var start = state.pos;

  if (state.eat(0x5C /* \ */)) {
    if (this.regexp_eatClassEscape(state)) {
      return true
    }
    if (state.switchU) {
      // Make the same message as V8.
      var ch$1 = state.current();
      if (ch$1 === 0x63 /* c */ || isOctalDigit(ch$1)) {
        state.raise("Invalid class escape");
      }
      state.raise("Invalid escape");
    }
    state.pos = start;
  }

  var ch = state.current();
  if (ch !== 0x5D /* ] */) {
    state.lastIntValue = ch;
    state.advance();
    return true
  }

  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-ClassEscape
pp$1.regexp_eatClassEscape = function(state) {
  var start = state.pos;

  if (state.eat(0x62 /* b */)) {
    state.lastIntValue = 0x08; /* <BS> */
    return true
  }

  if (state.switchU && state.eat(0x2D /* - */)) {
    state.lastIntValue = 0x2D; /* - */
    return true
  }

  if (!state.switchU && state.eat(0x63 /* c */)) {
    if (this.regexp_eatClassControlLetter(state)) {
      return true
    }
    state.pos = start;
  }

  return (
    this.regexp_eatCharacterClassEscape(state) ||
    this.regexp_eatCharacterEscape(state)
  )
};

// https://tc39.es/ecma262/#prod-ClassSetExpression
// https://tc39.es/ecma262/#prod-ClassUnion
// https://tc39.es/ecma262/#prod-ClassIntersection
// https://tc39.es/ecma262/#prod-ClassSubtraction
pp$1.regexp_classSetExpression = function(state) {
  var result = CharSetOk, subResult;
  if (this.regexp_eatClassSetRange(state)) ; else if (subResult = this.regexp_eatClassSetOperand(state)) {
    if (subResult === CharSetString) { result = CharSetString; }
    // https://tc39.es/ecma262/#prod-ClassIntersection
    var start = state.pos;
    while (state.eatChars([0x26, 0x26] /* && */)) {
      if (
        state.current() !== 0x26 /* & */ &&
        (subResult = this.regexp_eatClassSetOperand(state))
      ) {
        if (subResult !== CharSetString) { result = CharSetOk; }
        continue
      }
      state.raise("Invalid character in character class");
    }
    if (start !== state.pos) { return result }
    // https://tc39.es/ecma262/#prod-ClassSubtraction
    while (state.eatChars([0x2D, 0x2D] /* -- */)) {
      if (this.regexp_eatClassSetOperand(state)) { continue }
      state.raise("Invalid character in character class");
    }
    if (start !== state.pos) { return result }
  } else {
    state.raise("Invalid character in character class");
  }
  // https://tc39.es/ecma262/#prod-ClassUnion
  for (;;) {
    if (this.regexp_eatClassSetRange(state)) { continue }
    subResult = this.regexp_eatClassSetOperand(state);
    if (!subResult) { return result }
    if (subResult === CharSetString) { result = CharSetString; }
  }
};

// https://tc39.es/ecma262/#prod-ClassSetRange
pp$1.regexp_eatClassSetRange = function(state) {
  var start = state.pos;
  if (this.regexp_eatClassSetCharacter(state)) {
    var left = state.lastIntValue;
    if (state.eat(0x2D /* - */) && this.regexp_eatClassSetCharacter(state)) {
      var right = state.lastIntValue;
      if (left !== -1 && right !== -1 && left > right) {
        state.raise("Range out of order in character class");
      }
      return true
    }
    state.pos = start;
  }
  return false
};

// https://tc39.es/ecma262/#prod-ClassSetOperand
pp$1.regexp_eatClassSetOperand = function(state) {
  if (this.regexp_eatClassSetCharacter(state)) { return CharSetOk }
  return this.regexp_eatClassStringDisjunction(state) || this.regexp_eatNestedClass(state)
};

// https://tc39.es/ecma262/#prod-NestedClass
pp$1.regexp_eatNestedClass = function(state) {
  var start = state.pos;
  if (state.eat(0x5B /* [ */)) {
    var negate = state.eat(0x5E /* ^ */);
    var result = this.regexp_classContents(state);
    if (state.eat(0x5D /* ] */)) {
      if (negate && result === CharSetString) {
        state.raise("Negated character class may contain strings");
      }
      return result
    }
    state.pos = start;
  }
  if (state.eat(0x5C /* \ */)) {
    var result$1 = this.regexp_eatCharacterClassEscape(state);
    if (result$1) {
      return result$1
    }
    state.pos = start;
  }
  return null
};

// https://tc39.es/ecma262/#prod-ClassStringDisjunction
pp$1.regexp_eatClassStringDisjunction = function(state) {
  var start = state.pos;
  if (state.eatChars([0x5C, 0x71] /* \q */)) {
    if (state.eat(0x7B /* { */)) {
      var result = this.regexp_classStringDisjunctionContents(state);
      if (state.eat(0x7D /* } */)) {
        return result
      }
    } else {
      // Make the same message as V8.
      state.raise("Invalid escape");
    }
    state.pos = start;
  }
  return null
};

// https://tc39.es/ecma262/#prod-ClassStringDisjunctionContents
pp$1.regexp_classStringDisjunctionContents = function(state) {
  var result = this.regexp_classString(state);
  while (state.eat(0x7C /* | */)) {
    if (this.regexp_classString(state) === CharSetString) { result = CharSetString; }
  }
  return result
};

// https://tc39.es/ecma262/#prod-ClassString
// https://tc39.es/ecma262/#prod-NonEmptyClassString
pp$1.regexp_classString = function(state) {
  var count = 0;
  while (this.regexp_eatClassSetCharacter(state)) { count++; }
  return count === 1 ? CharSetOk : CharSetString
};

// https://tc39.es/ecma262/#prod-ClassSetCharacter
pp$1.regexp_eatClassSetCharacter = function(state) {
  var start = state.pos;
  if (state.eat(0x5C /* \ */)) {
    if (
      this.regexp_eatCharacterEscape(state) ||
      this.regexp_eatClassSetReservedPunctuator(state)
    ) {
      return true
    }
    if (state.eat(0x62 /* b */)) {
      state.lastIntValue = 0x08; /* <BS> */
      return true
    }
    state.pos = start;
    return false
  }
  var ch = state.current();
  if (ch < 0 || ch === state.lookahead() && isClassSetReservedDoublePunctuatorCharacter(ch)) { return false }
  if (isClassSetSyntaxCharacter(ch)) { return false }
  state.advance();
  state.lastIntValue = ch;
  return true
};

// https://tc39.es/ecma262/#prod-ClassSetReservedDoublePunctuator
function isClassSetReservedDoublePunctuatorCharacter(ch) {
  return (
    ch === 0x21 /* ! */ ||
    ch >= 0x23 /* # */ && ch <= 0x26 /* & */ ||
    ch >= 0x2A /* * */ && ch <= 0x2C /* , */ ||
    ch === 0x2E /* . */ ||
    ch >= 0x3A /* : */ && ch <= 0x40 /* @ */ ||
    ch === 0x5E /* ^ */ ||
    ch === 0x60 /* ` */ ||
    ch === 0x7E /* ~ */
  )
}

// https://tc39.es/ecma262/#prod-ClassSetSyntaxCharacter
function isClassSetSyntaxCharacter(ch) {
  return (
    ch === 0x28 /* ( */ ||
    ch === 0x29 /* ) */ ||
    ch === 0x2D /* - */ ||
    ch === 0x2F /* / */ ||
    ch >= 0x5B /* [ */ && ch <= 0x5D /* ] */ ||
    ch >= 0x7B /* { */ && ch <= 0x7D /* } */
  )
}

// https://tc39.es/ecma262/#prod-ClassSetReservedPunctuator
pp$1.regexp_eatClassSetReservedPunctuator = function(state) {
  var ch = state.current();
  if (isClassSetReservedPunctuator(ch)) {
    state.lastIntValue = ch;
    state.advance();
    return true
  }
  return false
};

// https://tc39.es/ecma262/#prod-ClassSetReservedPunctuator
function isClassSetReservedPunctuator(ch) {
  return (
    ch === 0x21 /* ! */ ||
    ch === 0x23 /* # */ ||
    ch === 0x25 /* % */ ||
    ch === 0x26 /* & */ ||
    ch === 0x2C /* , */ ||
    ch === 0x2D /* - */ ||
    ch >= 0x3A /* : */ && ch <= 0x3E /* > */ ||
    ch === 0x40 /* @ */ ||
    ch === 0x60 /* ` */ ||
    ch === 0x7E /* ~ */
  )
}

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-ClassControlLetter
pp$1.regexp_eatClassControlLetter = function(state) {
  var ch = state.current();
  if (isDecimalDigit(ch) || ch === 0x5F /* _ */) {
    state.lastIntValue = ch % 0x20;
    state.advance();
    return true
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-HexEscapeSequence
pp$1.regexp_eatHexEscapeSequence = function(state) {
  var start = state.pos;
  if (state.eat(0x78 /* x */)) {
    if (this.regexp_eatFixedHexDigits(state, 2)) {
      return true
    }
    if (state.switchU) {
      state.raise("Invalid escape");
    }
    state.pos = start;
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-DecimalDigits
pp$1.regexp_eatDecimalDigits = function(state) {
  var start = state.pos;
  var ch = 0;
  state.lastIntValue = 0;
  while (isDecimalDigit(ch = state.current())) {
    state.lastIntValue = 10 * state.lastIntValue + (ch - 0x30 /* 0 */);
    state.advance();
  }
  return state.pos !== start
};
function isDecimalDigit(ch) {
  return ch >= 0x30 /* 0 */ && ch <= 0x39 /* 9 */
}

// https://www.ecma-international.org/ecma-262/8.0/#prod-HexDigits
pp$1.regexp_eatHexDigits = function(state) {
  var start = state.pos;
  var ch = 0;
  state.lastIntValue = 0;
  while (isHexDigit(ch = state.current())) {
    state.lastIntValue = 16 * state.lastIntValue + hexToInt(ch);
    state.advance();
  }
  return state.pos !== start
};
function isHexDigit(ch) {
  return (
    (ch >= 0x30 /* 0 */ && ch <= 0x39 /* 9 */) ||
    (ch >= 0x41 /* A */ && ch <= 0x46 /* F */) ||
    (ch >= 0x61 /* a */ && ch <= 0x66 /* f */)
  )
}
function hexToInt(ch) {
  if (ch >= 0x41 /* A */ && ch <= 0x46 /* F */) {
    return 10 + (ch - 0x41 /* A */)
  }
  if (ch >= 0x61 /* a */ && ch <= 0x66 /* f */) {
    return 10 + (ch - 0x61 /* a */)
  }
  return ch - 0x30 /* 0 */
}

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-LegacyOctalEscapeSequence
// Allows only 0-377(octal) i.e. 0-255(decimal).
pp$1.regexp_eatLegacyOctalEscapeSequence = function(state) {
  if (this.regexp_eatOctalDigit(state)) {
    var n1 = state.lastIntValue;
    if (this.regexp_eatOctalDigit(state)) {
      var n2 = state.lastIntValue;
      if (n1 <= 3 && this.regexp_eatOctalDigit(state)) {
        state.lastIntValue = n1 * 64 + n2 * 8 + state.lastIntValue;
      } else {
        state.lastIntValue = n1 * 8 + n2;
      }
    } else {
      state.lastIntValue = n1;
    }
    return true
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-OctalDigit
pp$1.regexp_eatOctalDigit = function(state) {
  var ch = state.current();
  if (isOctalDigit(ch)) {
    state.lastIntValue = ch - 0x30; /* 0 */
    state.advance();
    return true
  }
  state.lastIntValue = 0;
  return false
};
function isOctalDigit(ch) {
  return ch >= 0x30 /* 0 */ && ch <= 0x37 /* 7 */
}

// https://www.ecma-international.org/ecma-262/8.0/#prod-Hex4Digits
// https://www.ecma-international.org/ecma-262/8.0/#prod-HexDigit
// And HexDigit HexDigit in https://www.ecma-international.org/ecma-262/8.0/#prod-HexEscapeSequence
pp$1.regexp_eatFixedHexDigits = function(state, length) {
  var start = state.pos;
  state.lastIntValue = 0;
  for (var i = 0; i < length; ++i) {
    var ch = state.current();
    if (!isHexDigit(ch)) {
      state.pos = start;
      return false
    }
    state.lastIntValue = 16 * state.lastIntValue + hexToInt(ch);
    state.advance();
  }
  return true
};

// Object type used to represent tokens. Note that normally, tokens
// simply exist as properties on the parser object. This is only
// used for the onToken callback and the external tokenizer.

var Token = function Token(p) {
  this.type = p.type;
  this.value = p.value;
  this.start = p.start;
  this.end = p.end;
  if (p.options.locations)
    { this.loc = new SourceLocation(p, p.startLoc, p.endLoc); }
  if (p.options.ranges)
    { this.range = [p.start, p.end]; }
};

// ## Tokenizer

var pp = Parser.prototype;

// Move to the next token

pp.next = function(ignoreEscapeSequenceInKeyword) {
  if (!ignoreEscapeSequenceInKeyword && this.type.keyword && this.containsEsc)
    { this.raiseRecoverable(this.start, "Escape sequence in keyword " + this.type.keyword); }
  if (this.options.onToken)
    { this.options.onToken(new Token(this)); }

  this.lastTokEnd = this.end;
  this.lastTokStart = this.start;
  this.lastTokEndLoc = this.endLoc;
  this.lastTokStartLoc = this.startLoc;
  this.nextToken();
};

pp.getToken = function() {
  this.next();
  return new Token(this)
};

// If we're in an ES6 environment, make parsers iterable
if (typeof Symbol !== "undefined")
  { pp[Symbol.iterator] = function() {
    var this$1$1 = this;

    return {
      next: function () {
        var token = this$1$1.getToken();
        return {
          done: token.type === types$1.eof,
          value: token
        }
      }
    }
  }; }

// Toggle strict mode. Re-reads the next number or string to please
// pedantic tests (`"use strict"; 010;` should fail).

// Read a single token, updating the parser object's token-related
// properties.

pp.nextToken = function() {
  var curContext = this.curContext();
  if (!curContext || !curContext.preserveSpace) { this.skipSpace(); }

  this.start = this.pos;
  if (this.options.locations) { this.startLoc = this.curPosition(); }
  if (this.pos >= this.input.length) { return this.finishToken(types$1.eof) }

  if (curContext.override) { return curContext.override(this) }
  else { this.readToken(this.fullCharCodeAtPos()); }
};

pp.readToken = function(code) {
  // Identifier or keyword. '\uXXXX' sequences are allowed in
  // identifiers, so '\' also dispatches to that.
  if (isIdentifierStart(code, this.options.ecmaVersion >= 6) || code === 92 /* '\' */)
    { return this.readWord() }

  return this.getTokenFromCode(code)
};

pp.fullCharCodeAtPos = function() {
  var code = this.input.charCodeAt(this.pos);
  if (code <= 0xd7ff || code >= 0xdc00) { return code }
  var next = this.input.charCodeAt(this.pos + 1);
  return next <= 0xdbff || next >= 0xe000 ? code : (code << 10) + next - 0x35fdc00
};

pp.skipBlockComment = function() {
  var startLoc = this.options.onComment && this.curPosition();
  var start = this.pos, end = this.input.indexOf("*/", this.pos += 2);
  if (end === -1) { this.raise(this.pos - 2, "Unterminated comment"); }
  this.pos = end + 2;
  if (this.options.locations) {
    for (var nextBreak = (void 0), pos = start; (nextBreak = nextLineBreak(this.input, pos, this.pos)) > -1;) {
      ++this.curLine;
      pos = this.lineStart = nextBreak;
    }
  }
  if (this.options.onComment)
    { this.options.onComment(true, this.input.slice(start + 2, end), start, this.pos,
                           startLoc, this.curPosition()); }
};

pp.skipLineComment = function(startSkip) {
  var start = this.pos;
  var startLoc = this.options.onComment && this.curPosition();
  var ch = this.input.charCodeAt(this.pos += startSkip);
  while (this.pos < this.input.length && !isNewLine(ch)) {
    ch = this.input.charCodeAt(++this.pos);
  }
  if (this.options.onComment)
    { this.options.onComment(false, this.input.slice(start + startSkip, this.pos), start, this.pos,
                           startLoc, this.curPosition()); }
};

// Called at the start of the parse and after every token. Skips
// whitespace and comments, and.

pp.skipSpace = function() {
  loop: while (this.pos < this.input.length) {
    var ch = this.input.charCodeAt(this.pos);
    switch (ch) {
    case 32: case 160: // ' '
      ++this.pos;
      break
    case 13:
      if (this.input.charCodeAt(this.pos + 1) === 10) {
        ++this.pos;
      }
    case 10: case 8232: case 8233:
      ++this.pos;
      if (this.options.locations) {
        ++this.curLine;
        this.lineStart = this.pos;
      }
      break
    case 47: // '/'
      switch (this.input.charCodeAt(this.pos + 1)) {
      case 42: // '*'
        this.skipBlockComment();
        break
      case 47:
        this.skipLineComment(2);
        break
      default:
        break loop
      }
      break
    default:
      if (ch > 8 && ch < 14 || ch >= 5760 && nonASCIIwhitespace.test(String.fromCharCode(ch))) {
        ++this.pos;
      } else {
        break loop
      }
    }
  }
};

// Called at the end of every token. Sets `end`, `val`, and
// maintains `context` and `exprAllowed`, and skips the space after
// the token, so that the next one's `start` will point at the
// right position.

pp.finishToken = function(type, val) {
  this.end = this.pos;
  if (this.options.locations) { this.endLoc = this.curPosition(); }
  var prevType = this.type;
  this.type = type;
  this.value = val;

  this.updateContext(prevType);
};

// ### Token reading

// This is the function that is called to fetch the next token. It
// is somewhat obscure, because it works in character codes rather
// than characters, and because operator parsing has been inlined
// into it.
//
// All in the name of speed.
//
pp.readToken_dot = function() {
  var next = this.input.charCodeAt(this.pos + 1);
  if (next >= 48 && next <= 57) { return this.readNumber(true) }
  var next2 = this.input.charCodeAt(this.pos + 2);
  if (this.options.ecmaVersion >= 6 && next === 46 && next2 === 46) { // 46 = dot '.'
    this.pos += 3;
    return this.finishToken(types$1.ellipsis)
  } else {
    ++this.pos;
    return this.finishToken(types$1.dot)
  }
};

pp.readToken_slash = function() { // '/'
  var next = this.input.charCodeAt(this.pos + 1);
  if (this.exprAllowed) { ++this.pos; return this.readRegexp() }
  if (next === 61) { return this.finishOp(types$1.assign, 2) }
  return this.finishOp(types$1.slash, 1)
};

pp.readToken_mult_modulo_exp = function(code) { // '%*'
  var next = this.input.charCodeAt(this.pos + 1);
  var size = 1;
  var tokentype = code === 42 ? types$1.star : types$1.modulo;

  // exponentiation operator ** and **=
  if (this.options.ecmaVersion >= 7 && code === 42 && next === 42) {
    ++size;
    tokentype = types$1.starstar;
    next = this.input.charCodeAt(this.pos + 2);
  }

  if (next === 61) { return this.finishOp(types$1.assign, size + 1) }
  return this.finishOp(tokentype, size)
};

pp.readToken_pipe_amp = function(code) { // '|&'
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === code) {
    if (this.options.ecmaVersion >= 12) {
      var next2 = this.input.charCodeAt(this.pos + 2);
      if (next2 === 61) { return this.finishOp(types$1.assign, 3) }
    }
    return this.finishOp(code === 124 ? types$1.logicalOR : types$1.logicalAND, 2)
  }
  if (next === 61) { return this.finishOp(types$1.assign, 2) }
  return this.finishOp(code === 124 ? types$1.bitwiseOR : types$1.bitwiseAND, 1)
};

pp.readToken_caret = function() { // '^'
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === 61) { return this.finishOp(types$1.assign, 2) }
  return this.finishOp(types$1.bitwiseXOR, 1)
};

pp.readToken_plus_min = function(code) { // '+-'
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === code) {
    if (next === 45 && !this.inModule && this.input.charCodeAt(this.pos + 2) === 62 &&
        (this.lastTokEnd === 0 || lineBreak.test(this.input.slice(this.lastTokEnd, this.pos)))) {
      // A `-->` line comment
      this.skipLineComment(3);
      this.skipSpace();
      return this.nextToken()
    }
    return this.finishOp(types$1.incDec, 2)
  }
  if (next === 61) { return this.finishOp(types$1.assign, 2) }
  return this.finishOp(types$1.plusMin, 1)
};

pp.readToken_lt_gt = function(code) { // '<>'
  var next = this.input.charCodeAt(this.pos + 1);
  var size = 1;
  if (next === code) {
    size = code === 62 && this.input.charCodeAt(this.pos + 2) === 62 ? 3 : 2;
    if (this.input.charCodeAt(this.pos + size) === 61) { return this.finishOp(types$1.assign, size + 1) }
    return this.finishOp(types$1.bitShift, size)
  }
  if (next === 33 && code === 60 && !this.inModule && this.input.charCodeAt(this.pos + 2) === 45 &&
      this.input.charCodeAt(this.pos + 3) === 45) {
    // `<!--`, an XML-style comment that should be interpreted as a line comment
    this.skipLineComment(4);
    this.skipSpace();
    return this.nextToken()
  }
  if (next === 61) { size = 2; }
  return this.finishOp(types$1.relational, size)
};

pp.readToken_eq_excl = function(code) { // '=!'
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === 61) { return this.finishOp(types$1.equality, this.input.charCodeAt(this.pos + 2) === 61 ? 3 : 2) }
  if (code === 61 && next === 62 && this.options.ecmaVersion >= 6) { // '=>'
    this.pos += 2;
    return this.finishToken(types$1.arrow)
  }
  return this.finishOp(code === 61 ? types$1.eq : types$1.prefix, 1)
};

pp.readToken_question = function() { // '?'
  var ecmaVersion = this.options.ecmaVersion;
  if (ecmaVersion >= 11) {
    var next = this.input.charCodeAt(this.pos + 1);
    if (next === 46) {
      var next2 = this.input.charCodeAt(this.pos + 2);
      if (next2 < 48 || next2 > 57) { return this.finishOp(types$1.questionDot, 2) }
    }
    if (next === 63) {
      if (ecmaVersion >= 12) {
        var next2$1 = this.input.charCodeAt(this.pos + 2);
        if (next2$1 === 61) { return this.finishOp(types$1.assign, 3) }
      }
      return this.finishOp(types$1.coalesce, 2)
    }
  }
  return this.finishOp(types$1.question, 1)
};

pp.readToken_numberSign = function() { // '#'
  var ecmaVersion = this.options.ecmaVersion;
  var code = 35; // '#'
  if (ecmaVersion >= 13) {
    ++this.pos;
    code = this.fullCharCodeAtPos();
    if (isIdentifierStart(code, true) || code === 92 /* '\' */) {
      return this.finishToken(types$1.privateId, this.readWord1())
    }
  }

  this.raise(this.pos, "Unexpected character '" + codePointToString(code) + "'");
};

pp.getTokenFromCode = function(code) {
  switch (code) {
  // The interpretation of a dot depends on whether it is followed
  // by a digit or another two dots.
  case 46: // '.'
    return this.readToken_dot()

  // Punctuation tokens.
  case 40: ++this.pos; return this.finishToken(types$1.parenL)
  case 41: ++this.pos; return this.finishToken(types$1.parenR)
  case 59: ++this.pos; return this.finishToken(types$1.semi)
  case 44: ++this.pos; return this.finishToken(types$1.comma)
  case 91: ++this.pos; return this.finishToken(types$1.bracketL)
  case 93: ++this.pos; return this.finishToken(types$1.bracketR)
  case 123: ++this.pos; return this.finishToken(types$1.braceL)
  case 125: ++this.pos; return this.finishToken(types$1.braceR)
  case 58: ++this.pos; return this.finishToken(types$1.colon)

  case 96: // '`'
    if (this.options.ecmaVersion < 6) { break }
    ++this.pos;
    return this.finishToken(types$1.backQuote)

  case 48: // '0'
    var next = this.input.charCodeAt(this.pos + 1);
    if (next === 120 || next === 88) { return this.readRadixNumber(16) } // '0x', '0X' - hex number
    if (this.options.ecmaVersion >= 6) {
      if (next === 111 || next === 79) { return this.readRadixNumber(8) } // '0o', '0O' - octal number
      if (next === 98 || next === 66) { return this.readRadixNumber(2) } // '0b', '0B' - binary number
    }

  // Anything else beginning with a digit is an integer, octal
  // number, or float.
  case 49: case 50: case 51: case 52: case 53: case 54: case 55: case 56: case 57: // 1-9
    return this.readNumber(false)

  // Quotes produce strings.
  case 34: case 39: // '"', "'"
    return this.readString(code)

  // Operators are parsed inline in tiny state machines. '=' (61) is
  // often referred to. `finishOp` simply skips the amount of
  // characters it is given as second argument, and returns a token
  // of the type given by its first argument.
  case 47: // '/'
    return this.readToken_slash()

  case 37: case 42: // '%*'
    return this.readToken_mult_modulo_exp(code)

  case 124: case 38: // '|&'
    return this.readToken_pipe_amp(code)

  case 94: // '^'
    return this.readToken_caret()

  case 43: case 45: // '+-'
    return this.readToken_plus_min(code)

  case 60: case 62: // '<>'
    return this.readToken_lt_gt(code)

  case 61: case 33: // '=!'
    return this.readToken_eq_excl(code)

  case 63: // '?'
    return this.readToken_question()

  case 126: // '~'
    return this.finishOp(types$1.prefix, 1)

  case 35: // '#'
    return this.readToken_numberSign()
  }

  this.raise(this.pos, "Unexpected character '" + codePointToString(code) + "'");
};

pp.finishOp = function(type, size) {
  var str = this.input.slice(this.pos, this.pos + size);
  this.pos += size;
  return this.finishToken(type, str)
};

pp.readRegexp = function() {
  var escaped, inClass, start = this.pos;
  for (;;) {
    if (this.pos >= this.input.length) { this.raise(start, "Unterminated regular expression"); }
    var ch = this.input.charAt(this.pos);
    if (lineBreak.test(ch)) { this.raise(start, "Unterminated regular expression"); }
    if (!escaped) {
      if (ch === "[") { inClass = true; }
      else if (ch === "]" && inClass) { inClass = false; }
      else if (ch === "/" && !inClass) { break }
      escaped = ch === "\\";
    } else { escaped = false; }
    ++this.pos;
  }
  var pattern = this.input.slice(start, this.pos);
  ++this.pos;
  var flagsStart = this.pos;
  var flags = this.readWord1();
  if (this.containsEsc) { this.unexpected(flagsStart); }

  // Validate pattern
  var state = this.regexpState || (this.regexpState = new RegExpValidationState(this));
  state.reset(start, pattern, flags);
  this.validateRegExpFlags(state);
  this.validateRegExpPattern(state);

  // Create Literal#value property value.
  var value = null;
  try {
    value = new RegExp(pattern, flags);
  } catch (e) {
    // ESTree requires null if it failed to instantiate RegExp object.
    // https://github.com/estree/estree/blob/a27003adf4fd7bfad44de9cef372a2eacd527b1c/es5.md#regexpliteral
  }

  return this.finishToken(types$1.regexp, {pattern: pattern, flags: flags, value: value})
};

// Read an integer in the given radix. Return null if zero digits
// were read, the integer value otherwise. When `len` is given, this
// will return `null` unless the integer has exactly `len` digits.

pp.readInt = function(radix, len, maybeLegacyOctalNumericLiteral) {
  // `len` is used for character escape sequences. In that case, disallow separators.
  var allowSeparators = this.options.ecmaVersion >= 12 && len === undefined;

  // `maybeLegacyOctalNumericLiteral` is true if it doesn't have prefix (0x,0o,0b)
  // and isn't fraction part nor exponent part. In that case, if the first digit
  // is zero then disallow separators.
  var isLegacyOctalNumericLiteral = maybeLegacyOctalNumericLiteral && this.input.charCodeAt(this.pos) === 48;

  var start = this.pos, total = 0, lastCode = 0;
  for (var i = 0, e = len == null ? Infinity : len; i < e; ++i, ++this.pos) {
    var code = this.input.charCodeAt(this.pos), val = (void 0);

    if (allowSeparators && code === 95) {
      if (isLegacyOctalNumericLiteral) { this.raiseRecoverable(this.pos, "Numeric separator is not allowed in legacy octal numeric literals"); }
      if (lastCode === 95) { this.raiseRecoverable(this.pos, "Numeric separator must be exactly one underscore"); }
      if (i === 0) { this.raiseRecoverable(this.pos, "Numeric separator is not allowed at the first of digits"); }
      lastCode = code;
      continue
    }

    if (code >= 97) { val = code - 97 + 10; } // a
    else if (code >= 65) { val = code - 65 + 10; } // A
    else if (code >= 48 && code <= 57) { val = code - 48; } // 0-9
    else { val = Infinity; }
    if (val >= radix) { break }
    lastCode = code;
    total = total * radix + val;
  }

  if (allowSeparators && lastCode === 95) { this.raiseRecoverable(this.pos - 1, "Numeric separator is not allowed at the last of digits"); }
  if (this.pos === start || len != null && this.pos - start !== len) { return null }

  return total
};

function stringToNumber(str, isLegacyOctalNumericLiteral) {
  if (isLegacyOctalNumericLiteral) {
    return parseInt(str, 8)
  }

  // `parseFloat(value)` stops parsing at the first numeric separator then returns a wrong value.
  return parseFloat(str.replace(/_/g, ""))
}

function stringToBigInt(str) {
  if (typeof BigInt !== "function") {
    return null
  }

  // `BigInt(value)` throws syntax error if the string contains numeric separators.
  return BigInt(str.replace(/_/g, ""))
}

pp.readRadixNumber = function(radix) {
  var start = this.pos;
  this.pos += 2; // 0x
  var val = this.readInt(radix);
  if (val == null) { this.raise(this.start + 2, "Expected number in radix " + radix); }
  if (this.options.ecmaVersion >= 11 && this.input.charCodeAt(this.pos) === 110) {
    val = stringToBigInt(this.input.slice(start, this.pos));
    ++this.pos;
  } else if (isIdentifierStart(this.fullCharCodeAtPos())) { this.raise(this.pos, "Identifier directly after number"); }
  return this.finishToken(types$1.num, val)
};

// Read an integer, octal integer, or floating-point number.

pp.readNumber = function(startsWithDot) {
  var start = this.pos;
  if (!startsWithDot && this.readInt(10, undefined, true) === null) { this.raise(start, "Invalid number"); }
  var octal = this.pos - start >= 2 && this.input.charCodeAt(start) === 48;
  if (octal && this.strict) { this.raise(start, "Invalid number"); }
  var next = this.input.charCodeAt(this.pos);
  if (!octal && !startsWithDot && this.options.ecmaVersion >= 11 && next === 110) {
    var val$1 = stringToBigInt(this.input.slice(start, this.pos));
    ++this.pos;
    if (isIdentifierStart(this.fullCharCodeAtPos())) { this.raise(this.pos, "Identifier directly after number"); }
    return this.finishToken(types$1.num, val$1)
  }
  if (octal && /[89]/.test(this.input.slice(start, this.pos))) { octal = false; }
  if (next === 46 && !octal) { // '.'
    ++this.pos;
    this.readInt(10);
    next = this.input.charCodeAt(this.pos);
  }
  if ((next === 69 || next === 101) && !octal) { // 'eE'
    next = this.input.charCodeAt(++this.pos);
    if (next === 43 || next === 45) { ++this.pos; } // '+-'
    if (this.readInt(10) === null) { this.raise(start, "Invalid number"); }
  }
  if (isIdentifierStart(this.fullCharCodeAtPos())) { this.raise(this.pos, "Identifier directly after number"); }

  var val = stringToNumber(this.input.slice(start, this.pos), octal);
  return this.finishToken(types$1.num, val)
};

// Read a string value, interpreting backslash-escapes.

pp.readCodePoint = function() {
  var ch = this.input.charCodeAt(this.pos), code;

  if (ch === 123) { // '{'
    if (this.options.ecmaVersion < 6) { this.unexpected(); }
    var codePos = ++this.pos;
    code = this.readHexChar(this.input.indexOf("}", this.pos) - this.pos);
    ++this.pos;
    if (code > 0x10FFFF) { this.invalidStringToken(codePos, "Code point out of bounds"); }
  } else {
    code = this.readHexChar(4);
  }
  return code
};

pp.readString = function(quote) {
  var out = "", chunkStart = ++this.pos;
  for (;;) {
    if (this.pos >= this.input.length) { this.raise(this.start, "Unterminated string constant"); }
    var ch = this.input.charCodeAt(this.pos);
    if (ch === quote) { break }
    if (ch === 92) { // '\'
      out += this.input.slice(chunkStart, this.pos);
      out += this.readEscapedChar(false);
      chunkStart = this.pos;
    } else if (ch === 0x2028 || ch === 0x2029) {
      if (this.options.ecmaVersion < 10) { this.raise(this.start, "Unterminated string constant"); }
      ++this.pos;
      if (this.options.locations) {
        this.curLine++;
        this.lineStart = this.pos;
      }
    } else {
      if (isNewLine(ch)) { this.raise(this.start, "Unterminated string constant"); }
      ++this.pos;
    }
  }
  out += this.input.slice(chunkStart, this.pos++);
  return this.finishToken(types$1.string, out)
};

// Reads template string tokens.

var INVALID_TEMPLATE_ESCAPE_ERROR = {};

pp.tryReadTemplateToken = function() {
  this.inTemplateElement = true;
  try {
    this.readTmplToken();
  } catch (err) {
    if (err === INVALID_TEMPLATE_ESCAPE_ERROR) {
      this.readInvalidTemplateToken();
    } else {
      throw err
    }
  }

  this.inTemplateElement = false;
};

pp.invalidStringToken = function(position, message) {
  if (this.inTemplateElement && this.options.ecmaVersion >= 9) {
    throw INVALID_TEMPLATE_ESCAPE_ERROR
  } else {
    this.raise(position, message);
  }
};

pp.readTmplToken = function() {
  var out = "", chunkStart = this.pos;
  for (;;) {
    if (this.pos >= this.input.length) { this.raise(this.start, "Unterminated template"); }
    var ch = this.input.charCodeAt(this.pos);
    if (ch === 96 || ch === 36 && this.input.charCodeAt(this.pos + 1) === 123) { // '`', '${'
      if (this.pos === this.start && (this.type === types$1.template || this.type === types$1.invalidTemplate)) {
        if (ch === 36) {
          this.pos += 2;
          return this.finishToken(types$1.dollarBraceL)
        } else {
          ++this.pos;
          return this.finishToken(types$1.backQuote)
        }
      }
      out += this.input.slice(chunkStart, this.pos);
      return this.finishToken(types$1.template, out)
    }
    if (ch === 92) { // '\'
      out += this.input.slice(chunkStart, this.pos);
      out += this.readEscapedChar(true);
      chunkStart = this.pos;
    } else if (isNewLine(ch)) {
      out += this.input.slice(chunkStart, this.pos);
      ++this.pos;
      switch (ch) {
      case 13:
        if (this.input.charCodeAt(this.pos) === 10) { ++this.pos; }
      case 10:
        out += "\n";
        break
      default:
        out += String.fromCharCode(ch);
        break
      }
      if (this.options.locations) {
        ++this.curLine;
        this.lineStart = this.pos;
      }
      chunkStart = this.pos;
    } else {
      ++this.pos;
    }
  }
};

// Reads a template token to search for the end, without validating any escape sequences
pp.readInvalidTemplateToken = function() {
  for (; this.pos < this.input.length; this.pos++) {
    switch (this.input[this.pos]) {
    case "\\":
      ++this.pos;
      break

    case "$":
      if (this.input[this.pos + 1] !== "{") {
        break
      }

    // falls through
    case "`":
      return this.finishToken(types$1.invalidTemplate, this.input.slice(this.start, this.pos))

    // no default
    }
  }
  this.raise(this.start, "Unterminated template");
};

// Used to read escaped characters

pp.readEscapedChar = function(inTemplate) {
  var ch = this.input.charCodeAt(++this.pos);
  ++this.pos;
  switch (ch) {
  case 110: return "\n" // 'n' -> '\n'
  case 114: return "\r" // 'r' -> '\r'
  case 120: return String.fromCharCode(this.readHexChar(2)) // 'x'
  case 117: return codePointToString(this.readCodePoint()) // 'u'
  case 116: return "\t" // 't' -> '\t'
  case 98: return "\b" // 'b' -> '\b'
  case 118: return "\u000b" // 'v' -> '\u000b'
  case 102: return "\f" // 'f' -> '\f'
  case 13: if (this.input.charCodeAt(this.pos) === 10) { ++this.pos; } // '\r\n'
  case 10: // ' \n'
    if (this.options.locations) { this.lineStart = this.pos; ++this.curLine; }
    return ""
  case 56:
  case 57:
    if (this.strict) {
      this.invalidStringToken(
        this.pos - 1,
        "Invalid escape sequence"
      );
    }
    if (inTemplate) {
      var codePos = this.pos - 1;

      this.invalidStringToken(
        codePos,
        "Invalid escape sequence in template string"
      );
    }
  default:
    if (ch >= 48 && ch <= 55) {
      var octalStr = this.input.substr(this.pos - 1, 3).match(/^[0-7]+/)[0];
      var octal = parseInt(octalStr, 8);
      if (octal > 255) {
        octalStr = octalStr.slice(0, -1);
        octal = parseInt(octalStr, 8);
      }
      this.pos += octalStr.length - 1;
      ch = this.input.charCodeAt(this.pos);
      if ((octalStr !== "0" || ch === 56 || ch === 57) && (this.strict || inTemplate)) {
        this.invalidStringToken(
          this.pos - 1 - octalStr.length,
          inTemplate
            ? "Octal literal in template string"
            : "Octal literal in strict mode"
        );
      }
      return String.fromCharCode(octal)
    }
    if (isNewLine(ch)) {
      // Unicode new line characters after \ get removed from output in both
      // template literals and strings
      return ""
    }
    return String.fromCharCode(ch)
  }
};

// Used to read character escape sequences ('\x', '\u', '\U').

pp.readHexChar = function(len) {
  var codePos = this.pos;
  var n = this.readInt(16, len);
  if (n === null) { this.invalidStringToken(codePos, "Bad character escape sequence"); }
  return n
};

// Read an identifier, and return it as a string. Sets `this.containsEsc`
// to whether the word contained a '\u' escape.
//
// Incrementally adds only escaped chars, adding other chunks as-is
// as a micro-optimization.

pp.readWord1 = function() {
  this.containsEsc = false;
  var word = "", first = true, chunkStart = this.pos;
  var astral = this.options.ecmaVersion >= 6;
  while (this.pos < this.input.length) {
    var ch = this.fullCharCodeAtPos();
    if (isIdentifierChar(ch, astral)) {
      this.pos += ch <= 0xffff ? 1 : 2;
    } else if (ch === 92) { // "\"
      this.containsEsc = true;
      word += this.input.slice(chunkStart, this.pos);
      var escStart = this.pos;
      if (this.input.charCodeAt(++this.pos) !== 117) // "u"
        { this.invalidStringToken(this.pos, "Expecting Unicode escape sequence \\uXXXX"); }
      ++this.pos;
      var esc = this.readCodePoint();
      if (!(first ? isIdentifierStart : isIdentifierChar)(esc, astral))
        { this.invalidStringToken(escStart, "Invalid Unicode escape"); }
      word += codePointToString(esc);
      chunkStart = this.pos;
    } else {
      break
    }
    first = false;
  }
  return word + this.input.slice(chunkStart, this.pos)
};

// Read an identifier or keyword token. Will check for reserved
// words when necessary.

pp.readWord = function() {
  var word = this.readWord1();
  var type = types$1.name;
  if (this.keywords.test(word)) {
    type = keywords[word];
  }
  return this.finishToken(type, word)
};

// Acorn is a tiny, fast JavaScript parser written in JavaScript.
//
// Acorn was written by Marijn Haverbeke, Ingvar Stepanyan, and
// various contributors and released under an MIT license.
//
// Git repositories for Acorn are available at
//
//     http://marijnhaverbeke.nl/git/acorn
//     https://github.com/acornjs/acorn.git
//
// Please use the [github bug tracker][ghbt] to report issues.
//
// [ghbt]: https://github.com/acornjs/acorn/issues
//
// [walk]: util/walk.js


var version = "8.10.0";

Parser.acorn = {
  Parser: Parser,
  version: version,
  defaultOptions: defaultOptions,
  Position: Position,
  SourceLocation: SourceLocation,
  getLineInfo: getLineInfo,
  Node: Node,
  TokenType: TokenType,
  tokTypes: types$1,
  keywordTypes: keywords,
  TokContext: TokContext,
  tokContexts: types,
  isIdentifierChar: isIdentifierChar,
  isIdentifierStart: isIdentifierStart,
  Token: Token,
  isNewLine: isNewLine,
  lineBreak: lineBreak,
  lineBreakG: lineBreakG,
  nonASCIIwhitespace: nonASCIIwhitespace
};

// The main exported interface (under `self.acorn` when in the
// browser) is a `parse` function that takes a code string and
// returns an abstract syntax tree as specified by [Mozilla parser
// API][api].
//
// [api]: https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API

function parse(input, options) {
  return Parser.parse(input, options)
}

// This function tries to parse a single expression at a given
// offset in a string. Useful for parsing mixed-language formats
// that embed JavaScript expressions.

function parseExpressionAt(input, pos, options) {
  return Parser.parseExpressionAt(input, pos, options)
}

// Acorn is organized as a tokenizer and a recursive-descent parser.
// The `tokenizer` export provides an interface to the tokenizer.

function tokenizer(input, options) {
  return Parser.tokenizer(input, options)
}

const _acorn = /*#__PURE__*/Object.defineProperty({
  __proto__: null,
  Node,
  Parser,
  Position,
  SourceLocation,
  TokContext,
  Token,
  TokenType,
  defaultOptions,
  getLineInfo,
  isIdentifierChar,
  isIdentifierStart,
  isNewLine,
  keywordTypes: keywords,
  lineBreak,
  lineBreakG,
  nonASCIIwhitespace,
  parse,
  parseExpressionAt,
  tokContexts: types,
  tokTypes: types$1,
  tokenizer,
  version
}, Symbol.toStringTag, { value: 'Module' });

function flru (max) {
	var num, curr, prev;
	var limit = max || 1;

	function keep(key, value) {
		if (++num > limit) {
			prev = curr;
			reset(1);
			++num;
		}
		curr[key] = value;
	}

	function reset(isPartial) {
		num = 0;
		curr = Object.create(null);
		isPartial || (prev=Object.create(null));
	}

	reset();

	return {
		clear: reset,
		has: function (key) {
			return curr[key] !== void 0 || prev[key] !== void 0;
		},
		get: function (key) {
			var val = curr[key];
			if (val !== void 0) return val;
			if ((val=prev[key]) !== void 0) {
				keep(key, val);
				return val;
			}
		},
		set: function (key, value) {
			if (curr[key] !== void 0) {
				curr[key] = value;
			} else {
				keep(key, value);
			}
		}
	};
}

function resolveIdViaPlugins(source, importer, pluginDriver, moduleLoaderResolveId, skip, customOptions, isEntry, assertions) {
    let skipped = null;
    let replaceContext = null;
    if (skip) {
        skipped = new Set();
        for (const skippedCall of skip) {
            if (source === skippedCall.source && importer === skippedCall.importer) {
                skipped.add(skippedCall.plugin);
            }
        }
        replaceContext = (pluginContext, plugin) => ({
            ...pluginContext,
            resolve: (source, importer, { assertions, custom, isEntry, skipSelf } = BLANK) => moduleLoaderResolveId(source, importer, custom, isEntry, assertions || EMPTY_OBJECT, skipSelf ? [...skip, { importer, plugin, source }] : skip)
        });
    }
    return pluginDriver.hookFirstAndGetPlugin('resolveId', [source, importer, { assertions, custom: customOptions, isEntry }], replaceContext, skipped);
}

async function resolveId(source, importer, preserveSymlinks, pluginDriver, moduleLoaderResolveId, skip, customOptions, isEntry, assertions) {
    const pluginResult = await resolveIdViaPlugins(source, importer, pluginDriver, moduleLoaderResolveId, skip, customOptions, isEntry, assertions);
    if (pluginResult != null) {
        const [resolveIdResult, plugin] = pluginResult;
        if (typeof resolveIdResult === 'object' && !resolveIdResult.resolvedBy) {
            return {
                ...resolveIdResult,
                resolvedBy: plugin.name
            };
        }
        if (typeof resolveIdResult === 'string') {
            return {
                id: resolveIdResult,
                resolvedBy: plugin.name
            };
        }
        return resolveIdResult;
    }
    // external modules (non-entry modules that start with neither '.' or '/')
    // are skipped at this stage.
    if (importer !== undefined && !isAbsolute(source) && source[0] !== '.')
        return null;
    // `resolve` processes paths from right to left, prepending them until an
    // absolute path is created. Absolute importees therefore shortcircuit the
    // resolve call and require no special handing on our part.
    // See https://nodejs.org/api/path.html#path_path_resolve_paths
    return addJsExtensionIfNecessary(importer ? resolve(dirname(importer), source) : resolve(source), preserveSymlinks);
}
async function addJsExtensionIfNecessary(file, preserveSymlinks) {
    return ((await findFile(file, preserveSymlinks)) ??
        (await findFile(file + '.mjs', preserveSymlinks)) ??
        (await findFile(file + '.js', preserveSymlinks)));
}
async function findFile(file, preserveSymlinks) {
    try {
        const stats = await lstat(file);
        if (!preserveSymlinks && stats.isSymbolicLink())
            return await findFile(await realpath(file), preserveSymlinks);
        if ((preserveSymlinks && stats.isSymbolicLink()) || stats.isFile()) {
            // check case
            const name = basename(file);
            const files = await readdir(dirname(file));
            if (files.includes(name))
                return file;
        }
    }
    catch {
        // suppress
    }
}

const ANONYMOUS_PLUGIN_PREFIX = 'at position ';
const ANONYMOUS_OUTPUT_PLUGIN_PREFIX = 'at output position ';

function createPluginCache(cache) {
    return {
        delete(id) {
            return delete cache[id];
        },
        get(id) {
            const item = cache[id];
            if (!item)
                return;
            item[0] = 0;
            return item[1];
        },
        has(id) {
            const item = cache[id];
            if (!item)
                return false;
            item[0] = 0;
            return true;
        },
        set(id, value) {
            cache[id] = [0, value];
        }
    };
}
function getTrackedPluginCache(pluginCache, onUse) {
    return {
        delete(id) {
            onUse();
            return pluginCache.delete(id);
        },
        get(id) {
            onUse();
            return pluginCache.get(id);
        },
        has(id) {
            onUse();
            return pluginCache.has(id);
        },
        set(id, value) {
            onUse();
            return pluginCache.set(id, value);
        }
    };
}
const NO_CACHE = {
    delete() {
        return false;
    },
    get() {
        return undefined;
    },
    has() {
        return false;
    },
    set() { }
};
function uncacheablePluginError(pluginName) {
    if (pluginName.startsWith(ANONYMOUS_PLUGIN_PREFIX) ||
        pluginName.startsWith(ANONYMOUS_OUTPUT_PLUGIN_PREFIX)) {
        return error(logAnonymousPluginCache());
    }
    return error(logDuplicatePluginName(pluginName));
}
function getCacheForUncacheablePlugin(pluginName) {
    return {
        delete() {
            return uncacheablePluginError(pluginName);
        },
        get() {
            return uncacheablePluginError(pluginName);
        },
        has() {
            return uncacheablePluginError(pluginName);
        },
        set() {
            return uncacheablePluginError(pluginName);
        }
    };
}

async function asyncFlatten(array) {
    do {
        array = (await Promise.all(array)).flat(Infinity);
    } while (array.some((v) => v?.then));
    return array;
}

const getOnLog = (config, logLevel, printLog = defaultPrintLog) => {
    const { onwarn, onLog } = config;
    const defaultOnLog = getDefaultOnLog(printLog, onwarn);
    if (onLog) {
        const minimalPriority = logLevelPriority[logLevel];
        return (level, log) => onLog(level, addLogToString(log), (level, handledLog) => {
            if (level === LOGLEVEL_ERROR) {
                return error(normalizeLog(handledLog));
            }
            if (logLevelPriority[level] >= minimalPriority) {
                defaultOnLog(level, normalizeLog(handledLog));
            }
        });
    }
    return defaultOnLog;
};
const getDefaultOnLog = (printLog, onwarn) => onwarn
    ? (level, log) => {
        if (level === LOGLEVEL_WARN) {
            onwarn(addLogToString(log), warning => printLog(LOGLEVEL_WARN, normalizeLog(warning)));
        }
        else {
            printLog(level, log);
        }
    }
    : printLog;
const addLogToString = (log) => {
    Object.defineProperty(log, 'toString', {
        value: () => getExtendedLogMessage(log),
        writable: true
    });
    return log;
};
const normalizeLog = (log) => typeof log === 'string'
    ? { message: log }
    : typeof log === 'function'
        ? normalizeLog(log())
        : log;
const getExtendedLogMessage = (log) => {
    let prefix = '';
    if (log.plugin) {
        prefix += `(${log.plugin} plugin) `;
    }
    if (log.loc) {
        prefix += `${relativeId(log.loc.file)} (${log.loc.line}:${log.loc.column}) `;
    }
    return prefix + log.message;
};
const defaultPrintLog = (level, log) => {
    const message = getExtendedLogMessage(log);
    switch (level) {
        case LOGLEVEL_WARN: {
            return console.warn(message);
        }
        case LOGLEVEL_DEBUG: {
            return console.debug(message);
        }
        default: {
            return console.info(message);
        }
    }
};
function warnUnknownOptions(passedOptions, validOptions, optionType, log, ignoredKeys = /$./) {
    const validOptionSet = new Set(validOptions);
    const unknownOptions = Object.keys(passedOptions).filter(key => !(validOptionSet.has(key) || ignoredKeys.test(key)));
    if (unknownOptions.length > 0) {
        log(LOGLEVEL_WARN, logUnknownOption(optionType, unknownOptions, [...validOptionSet].sort()));
    }
}
const treeshakePresets = {
    recommended: {
        annotations: true,
        correctVarValueBeforeDeclaration: false,
        manualPureFunctions: EMPTY_ARRAY,
        moduleSideEffects: () => true,
        propertyReadSideEffects: true,
        tryCatchDeoptimization: true,
        unknownGlobalSideEffects: false
    },
    safest: {
        annotations: true,
        correctVarValueBeforeDeclaration: true,
        manualPureFunctions: EMPTY_ARRAY,
        moduleSideEffects: () => true,
        propertyReadSideEffects: true,
        tryCatchDeoptimization: true,
        unknownGlobalSideEffects: true
    },
    smallest: {
        annotations: true,
        correctVarValueBeforeDeclaration: false,
        manualPureFunctions: EMPTY_ARRAY,
        moduleSideEffects: () => false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
        unknownGlobalSideEffects: false
    }
};
const generatedCodePresets = {
    es2015: {
        arrowFunctions: true,
        constBindings: true,
        objectShorthand: true,
        reservedNamesAsProps: true,
        symbols: true
    },
    es5: {
        arrowFunctions: false,
        constBindings: false,
        objectShorthand: false,
        reservedNamesAsProps: true,
        symbols: false
    }
};
const objectifyOption = (value) => value && typeof value === 'object' ? value : {};
const objectifyOptionWithPresets = (presets, optionName, urlSnippet, additionalValues) => (value) => {
    if (typeof value === 'string') {
        const preset = presets[value];
        if (preset) {
            return preset;
        }
        error(logInvalidOption(optionName, urlSnippet, `valid values are ${additionalValues}${printQuotedStringList(Object.keys(presets))}. You can also supply an object for more fine-grained control`, value));
    }
    return objectifyOption(value);
};
const getOptionWithPreset = (value, presets, optionName, urlSnippet, additionalValues) => {
    const presetName = value?.preset;
    if (presetName) {
        const preset = presets[presetName];
        if (preset) {
            return { ...preset, ...value };
        }
        else {
            error(logInvalidOption(`${optionName}.preset`, urlSnippet, `valid values are ${printQuotedStringList(Object.keys(presets))}`, presetName));
        }
    }
    return objectifyOptionWithPresets(presets, optionName, urlSnippet, additionalValues)(value);
};
const normalizePluginOption = async (plugins) => (await asyncFlatten([plugins])).filter(Boolean);

async function transform(source, module, pluginDriver, log) {
    const id = module.id;
    const sourcemapChain = [];
    let originalSourcemap = source.map === null ? null : decodedSourcemap(source.map);
    const originalCode = source.code;
    let ast = source.ast;
    const transformDependencies = [];
    const emittedFiles = [];
    let customTransformCache = false;
    const useCustomTransformCache = () => (customTransformCache = true);
    let pluginName = '';
    let currentSource = source.code;
    function transformReducer(previousCode, result, plugin) {
        let code;
        let map;
        if (typeof result === 'string') {
            code = result;
        }
        else if (result && typeof result === 'object') {
            module.updateOptions(result);
            if (result.code == null) {
                if (result.map || result.ast) {
                    log(LOGLEVEL_WARN, logNoTransformMapOrAstWithoutCode(plugin.name));
                }
                return previousCode;
            }
            ({ code, map, ast } = result);
        }
        else {
            return previousCode;
        }
        // strict null check allows 'null' maps to not be pushed to the chain,
        // while 'undefined' gets the missing map warning
        if (map !== null) {
            sourcemapChain.push(decodedSourcemap(typeof map === 'string' ? JSON.parse(map) : map) || {
                missing: true,
                plugin: plugin.name
            });
        }
        currentSource = code;
        return code;
    }
    const getLogHandler = (handler) => (log, pos) => {
        log = normalizeLog(log);
        if (pos)
            augmentCodeLocation(log, pos, currentSource, id);
        log.id = id;
        log.hook = 'transform';
        handler(log);
    };
    let code;
    try {
        code = await pluginDriver.hookReduceArg0('transform', [currentSource, id], transformReducer, (pluginContext, plugin) => {
            pluginName = plugin.name;
            return {
                ...pluginContext,
                addWatchFile(id) {
                    transformDependencies.push(id);
                    pluginContext.addWatchFile(id);
                },
                cache: customTransformCache
                    ? pluginContext.cache
                    : getTrackedPluginCache(pluginContext.cache, useCustomTransformCache),
                debug: getLogHandler(pluginContext.debug),
                emitFile(emittedFile) {
                    emittedFiles.push(emittedFile);
                    return pluginDriver.emitFile(emittedFile);
                },
                error(error_, pos) {
                    if (typeof error_ === 'string')
                        error_ = { message: error_ };
                    if (pos)
                        augmentCodeLocation(error_, pos, currentSource, id);
                    error_.id = id;
                    error_.hook = 'transform';
                    return pluginContext.error(error_);
                },
                getCombinedSourcemap() {
                    const combinedMap = collapseSourcemap(id, originalCode, originalSourcemap, sourcemapChain, log);
                    if (!combinedMap) {
                        const magicString = new MagicString(originalCode);
                        return magicString.generateMap({ hires: true, includeContent: true, source: id });
                    }
                    if (originalSourcemap !== combinedMap) {
                        originalSourcemap = combinedMap;
                        sourcemapChain.length = 0;
                    }
                    return new SourceMap({
                        ...combinedMap,
                        file: null,
                        sourcesContent: combinedMap.sourcesContent
                    });
                },
                info: getLogHandler(pluginContext.info),
                setAssetSource() {
                    return this.error(logInvalidSetAssetSourceCall());
                },
                warn: getLogHandler(pluginContext.warn)
            };
        });
    }
    catch (error_) {
        return error(logPluginError(error_, pluginName, { hook: 'transform', id }));
    }
    if (!customTransformCache && // files emitted by a transform hook need to be emitted again if the hook is skipped
        emittedFiles.length > 0)
        module.transformFiles = emittedFiles;
    return {
        ast,
        code,
        customTransformCache,
        originalCode,
        originalSourcemap,
        sourcemapChain,
        transformDependencies
    };
}

const RESOLVE_DEPENDENCIES = 'resolveDependencies';
class ModuleLoader {
    constructor(graph, modulesById, options, pluginDriver) {
        this.graph = graph;
        this.modulesById = modulesById;
        this.options = options;
        this.pluginDriver = pluginDriver;
        this.implicitEntryModules = new Set();
        this.indexedEntryModules = [];
        this.latestLoadModulesPromise = Promise.resolve();
        this.moduleLoadPromises = new Map();
        this.modulesWithLoadedDependencies = new Set();
        this.nextChunkNamePriority = 0;
        this.nextEntryModuleIndex = 0;
        this.resolveId = async (source, importer, customOptions, isEntry, assertions, skip = null) => this.getResolvedIdWithDefaults(this.getNormalizedResolvedIdWithoutDefaults(this.options.external(source, importer, false)
            ? false
            : await resolveId(source, importer, this.options.preserveSymlinks, this.pluginDriver, this.resolveId, skip, customOptions, typeof isEntry === 'boolean' ? isEntry : !importer, assertions), importer, source), assertions);
        this.hasModuleSideEffects = options.treeshake
            ? options.treeshake.moduleSideEffects
            : () => true;
    }
    async addAdditionalModules(unresolvedModules, isAddForManualChunks) {
        const result = this.extendLoadModulesPromise(Promise.all(unresolvedModules.map(id => this.loadEntryModule(id, false, undefined, null, isAddForManualChunks))));
        await this.awaitLoadModulesPromise();
        return result;
    }
    async addEntryModules(unresolvedEntryModules, isUserDefined) {
        const firstEntryModuleIndex = this.nextEntryModuleIndex;
        this.nextEntryModuleIndex += unresolvedEntryModules.length;
        const firstChunkNamePriority = this.nextChunkNamePriority;
        this.nextChunkNamePriority += unresolvedEntryModules.length;
        const newEntryModules = await this.extendLoadModulesPromise(Promise.all(unresolvedEntryModules.map(({ id, importer }) => this.loadEntryModule(id, true, importer, null))).then(entryModules => {
            for (const [index, entryModule] of entryModules.entries()) {
                entryModule.isUserDefinedEntryPoint =
                    entryModule.isUserDefinedEntryPoint || isUserDefined;
                addChunkNamesToModule(entryModule, unresolvedEntryModules[index], isUserDefined, firstChunkNamePriority + index);
                const existingIndexedModule = this.indexedEntryModules.find(indexedModule => indexedModule.module === entryModule);
                if (existingIndexedModule) {
                    existingIndexedModule.index = Math.min(existingIndexedModule.index, firstEntryModuleIndex + index);
                }
                else {
                    this.indexedEntryModules.push({
                        index: firstEntryModuleIndex + index,
                        module: entryModule
                    });
                }
            }
            this.indexedEntryModules.sort(({ index: indexA }, { index: indexB }) => indexA > indexB ? 1 : -1);
            return entryModules;
        }));
        await this.awaitLoadModulesPromise();
        return {
            entryModules: this.indexedEntryModules.map(({ module }) => module),
            implicitEntryModules: [...this.implicitEntryModules],
            newEntryModules
        };
    }
    async emitChunk({ fileName, id, importer, name, implicitlyLoadedAfterOneOf, preserveSignature }) {
        const unresolvedModule = {
            fileName: fileName || null,
            id,
            importer,
            name: name || null
        };
        const module = implicitlyLoadedAfterOneOf
            ? await this.addEntryWithImplicitDependants(unresolvedModule, implicitlyLoadedAfterOneOf)
            : (await this.addEntryModules([unresolvedModule], false)).newEntryModules[0];
        if (preserveSignature != null) {
            module.preserveSignature = preserveSignature;
        }
        return module;
    }
    async preloadModule(resolvedId) {
        const module = await this.fetchModule(this.getResolvedIdWithDefaults(resolvedId, EMPTY_OBJECT), undefined, false, resolvedId.resolveDependencies ? RESOLVE_DEPENDENCIES : true);
        return module.info;
    }
    addEntryWithImplicitDependants(unresolvedModule, implicitlyLoadedAfter) {
        const chunkNamePriority = this.nextChunkNamePriority++;
        return this.extendLoadModulesPromise(this.loadEntryModule(unresolvedModule.id, false, unresolvedModule.importer, null).then(async (entryModule) => {
            addChunkNamesToModule(entryModule, unresolvedModule, false, chunkNamePriority);
            if (!entryModule.info.isEntry) {
                this.implicitEntryModules.add(entryModule);
                const implicitlyLoadedAfterModules = await Promise.all(implicitlyLoadedAfter.map(id => this.loadEntryModule(id, false, unresolvedModule.importer, entryModule.id)));
                for (const module of implicitlyLoadedAfterModules) {
                    entryModule.implicitlyLoadedAfter.add(module);
                }
                for (const dependant of entryModule.implicitlyLoadedAfter) {
                    dependant.implicitlyLoadedBefore.add(entryModule);
                }
            }
            return entryModule;
        }));
    }
    async addModuleSource(id, importer, module) {
        let source;
        try {
            source = await this.graph.fileOperationQueue.run(async () => (await this.pluginDriver.hookFirst('load', [id])) ?? (await readFile(id, 'utf8')));
        }
        catch (error_) {
            let message = `Could not load ${id}`;
            if (importer)
                message += ` (imported by ${relativeId(importer)})`;
            message += `: ${error_.message}`;
            error_.message = message;
            throw error_;
        }
        const sourceDescription = typeof source === 'string'
            ? { code: source }
            : source != null && typeof source === 'object' && typeof source.code === 'string'
                ? source
                : error(logBadLoader(id));
        const cachedModule = this.graph.cachedModules.get(id);
        if (cachedModule &&
            !cachedModule.customTransformCache &&
            cachedModule.originalCode === sourceDescription.code &&
            !(await this.pluginDriver.hookFirst('shouldTransformCachedModule', [
                {
                    ast: cachedModule.ast,
                    code: cachedModule.code,
                    id: cachedModule.id,
                    meta: cachedModule.meta,
                    moduleSideEffects: cachedModule.moduleSideEffects,
                    resolvedSources: cachedModule.resolvedIds,
                    syntheticNamedExports: cachedModule.syntheticNamedExports
                }
            ]))) {
            if (cachedModule.transformFiles) {
                for (const emittedFile of cachedModule.transformFiles)
                    this.pluginDriver.emitFile(emittedFile);
            }
            module.setSource(cachedModule);
        }
        else {
            module.updateOptions(sourceDescription);
            module.setSource(await transform(sourceDescription, module, this.pluginDriver, this.options.onLog));
        }
    }
    async awaitLoadModulesPromise() {
        let startingPromise;
        do {
            startingPromise = this.latestLoadModulesPromise;
            await startingPromise;
        } while (startingPromise !== this.latestLoadModulesPromise);
    }
    extendLoadModulesPromise(loadNewModulesPromise) {
        this.latestLoadModulesPromise = Promise.all([
            loadNewModulesPromise,
            this.latestLoadModulesPromise
        ]);
        this.latestLoadModulesPromise.catch(() => {
            /* Avoid unhandled Promise rejections */
        });
        return loadNewModulesPromise;
    }
    async fetchDynamicDependencies(module, resolveDynamicImportPromises) {
        const dependencies = await Promise.all(resolveDynamicImportPromises.map(resolveDynamicImportPromise => resolveDynamicImportPromise.then(async ([dynamicImport, resolvedId]) => {
            if (resolvedId === null)
                return null;
            if (typeof resolvedId === 'string') {
                dynamicImport.resolution = resolvedId;
                return null;
            }
            return (dynamicImport.resolution = await this.fetchResolvedDependency(relativeId(resolvedId.id), module.id, resolvedId));
        })));
        for (const dependency of dependencies) {
            if (dependency) {
                module.dynamicDependencies.add(dependency);
                dependency.dynamicImporters.push(module.id);
            }
        }
    }
    // If this is a preload, then this method always waits for the dependencies of
    // the module to be resolved.
    // Otherwise, if the module does not exist, it waits for the module and all
    // its dependencies to be loaded.
    // Otherwise, it returns immediately.
    async fetchModule({ assertions, id, meta, moduleSideEffects, syntheticNamedExports }, importer, isEntry, isPreload) {
        const existingModule = this.modulesById.get(id);
        if (existingModule instanceof Module) {
            if (importer && doAssertionsDiffer(assertions, existingModule.info.assertions)) {
                this.options.onLog(LOGLEVEL_WARN, logInconsistentImportAssertions(existingModule.info.assertions, assertions, id, importer));
            }
            await this.handleExistingModule(existingModule, isEntry, isPreload);
            return existingModule;
        }
        if (existingModule instanceof ExternalModule) {
            return error(logExternalModulesCannotBeTransformedToModules(existingModule.id));
        }
        const module = new Module(this.graph, id, this.options, isEntry, moduleSideEffects, syntheticNamedExports, meta, assertions);
        this.modulesById.set(id, module);
        this.graph.watchFiles[id] = true;
        const loadPromise = this.addModuleSource(id, importer, module).then(() => [
            this.getResolveStaticDependencyPromises(module),
            this.getResolveDynamicImportPromises(module),
            loadAndResolveDependenciesPromise
        ]);
        const loadAndResolveDependenciesPromise = waitForDependencyResolution(loadPromise).then(() => this.pluginDriver.hookParallel('moduleParsed', [module.info]));
        loadAndResolveDependenciesPromise.catch(() => {
            /* avoid unhandled promise rejections */
        });
        this.moduleLoadPromises.set(module, loadPromise);
        const resolveDependencyPromises = await loadPromise;
        if (!isPreload) {
            await this.fetchModuleDependencies(module, ...resolveDependencyPromises);
        }
        else if (isPreload === RESOLVE_DEPENDENCIES) {
            await loadAndResolveDependenciesPromise;
        }
        return module;
    }
    async fetchModuleDependencies(module, resolveStaticDependencyPromises, resolveDynamicDependencyPromises, loadAndResolveDependenciesPromise) {
        if (this.modulesWithLoadedDependencies.has(module)) {
            return;
        }
        this.modulesWithLoadedDependencies.add(module);
        await Promise.all([
            this.fetchStaticDependencies(module, resolveStaticDependencyPromises),
            this.fetchDynamicDependencies(module, resolveDynamicDependencyPromises)
        ]);
        module.linkImports();
        // To handle errors when resolving dependencies or in moduleParsed
        await loadAndResolveDependenciesPromise;
    }
    fetchResolvedDependency(source, importer, resolvedId) {
        if (resolvedId.external) {
            const { assertions, external, id, moduleSideEffects, meta } = resolvedId;
            let externalModule = this.modulesById.get(id);
            if (!externalModule) {
                externalModule = new ExternalModule(this.options, id, moduleSideEffects, meta, external !== 'absolute' && isAbsolute(id), assertions);
                this.modulesById.set(id, externalModule);
            }
            else if (!(externalModule instanceof ExternalModule)) {
                return error(logInternalIdCannotBeExternal(source, importer));
            }
            else if (doAssertionsDiffer(externalModule.info.assertions, assertions)) {
                this.options.onLog(LOGLEVEL_WARN, logInconsistentImportAssertions(externalModule.info.assertions, assertions, source, importer));
            }
            return Promise.resolve(externalModule);
        }
        return this.fetchModule(resolvedId, importer, false, false);
    }
    async fetchStaticDependencies(module, resolveStaticDependencyPromises) {
        for (const dependency of await Promise.all(resolveStaticDependencyPromises.map(resolveStaticDependencyPromise => resolveStaticDependencyPromise.then(([source, resolvedId]) => this.fetchResolvedDependency(source, module.id, resolvedId))))) {
            module.dependencies.add(dependency);
            dependency.importers.push(module.id);
        }
        if (!this.options.treeshake || module.info.moduleSideEffects === 'no-treeshake') {
            for (const dependency of module.dependencies) {
                if (dependency instanceof Module) {
                    dependency.importedFromNotTreeshaken = true;
                }
            }
        }
    }
    getNormalizedResolvedIdWithoutDefaults(resolveIdResult, importer, source) {
        const { makeAbsoluteExternalsRelative } = this.options;
        if (resolveIdResult) {
            if (typeof resolveIdResult === 'object') {
                const external = resolveIdResult.external || this.options.external(resolveIdResult.id, importer, true);
                return {
                    ...resolveIdResult,
                    external: external &&
                        (external === 'relative' ||
                            !isAbsolute(resolveIdResult.id) ||
                            (external === true &&
                                isNotAbsoluteExternal(resolveIdResult.id, source, makeAbsoluteExternalsRelative)) ||
                            'absolute')
                };
            }
            const external = this.options.external(resolveIdResult, importer, true);
            return {
                external: external &&
                    (isNotAbsoluteExternal(resolveIdResult, source, makeAbsoluteExternalsRelative) ||
                        'absolute'),
                id: external && makeAbsoluteExternalsRelative
                    ? normalizeRelativeExternalId(resolveIdResult, importer)
                    : resolveIdResult
            };
        }
        const id = makeAbsoluteExternalsRelative
            ? normalizeRelativeExternalId(source, importer)
            : source;
        if (resolveIdResult !== false && !this.options.external(id, importer, true)) {
            return null;
        }
        return {
            external: isNotAbsoluteExternal(id, source, makeAbsoluteExternalsRelative) || 'absolute',
            id
        };
    }
    getResolveDynamicImportPromises(module) {
        return module.dynamicImports.map(async (dynamicImport) => {
            const resolvedId = await this.resolveDynamicImport(module, typeof dynamicImport.argument === 'string'
                ? dynamicImport.argument
                : dynamicImport.argument.esTreeNode, module.id, getAssertionsFromImportExpression(dynamicImport.node));
            if (resolvedId && typeof resolvedId === 'object') {
                dynamicImport.id = resolvedId.id;
            }
            return [dynamicImport, resolvedId];
        });
    }
    getResolveStaticDependencyPromises(module) {
        // eslint-disable-next-line unicorn/prefer-spread
        return Array.from(module.sourcesWithAssertions, async ([source, assertions]) => [
            source,
            (module.resolvedIds[source] =
                module.resolvedIds[source] ||
                    this.handleInvalidResolvedId(await this.resolveId(source, module.id, EMPTY_OBJECT, false, assertions), source, module.id, assertions))
        ]);
    }
    getResolvedIdWithDefaults(resolvedId, assertions) {
        if (!resolvedId) {
            return null;
        }
        const external = resolvedId.external || false;
        return {
            assertions: resolvedId.assertions || assertions,
            external,
            id: resolvedId.id,
            meta: resolvedId.meta || {},
            moduleSideEffects: resolvedId.moduleSideEffects ?? this.hasModuleSideEffects(resolvedId.id, !!external),
            resolvedBy: resolvedId.resolvedBy ?? 'rollup',
            syntheticNamedExports: resolvedId.syntheticNamedExports ?? false
        };
    }
    async handleExistingModule(module, isEntry, isPreload) {
        const loadPromise = this.moduleLoadPromises.get(module);
        if (isPreload) {
            return isPreload === RESOLVE_DEPENDENCIES
                ? waitForDependencyResolution(loadPromise)
                : loadPromise;
        }
        if (isEntry) {
            module.info.isEntry = true;
            this.implicitEntryModules.delete(module);
            for (const dependant of module.implicitlyLoadedAfter) {
                dependant.implicitlyLoadedBefore.delete(module);
            }
            module.implicitlyLoadedAfter.clear();
        }
        return this.fetchModuleDependencies(module, ...(await loadPromise));
    }
    handleInvalidResolvedId(resolvedId, source, importer, assertions) {
        if (resolvedId === null) {
            if (isRelative(source)) {
                return error(logUnresolvedImport(source, importer));
            }
            this.options.onLog(LOGLEVEL_WARN, logUnresolvedImportTreatedAsExternal(source, importer));
            return {
                assertions,
                external: true,
                id: source,
                meta: {},
                moduleSideEffects: this.hasModuleSideEffects(source, true),
                resolvedBy: 'rollup',
                syntheticNamedExports: false
            };
        }
        else if (resolvedId.external && resolvedId.syntheticNamedExports) {
            this.options.onLog(LOGLEVEL_WARN, logExternalSyntheticExports(source, importer));
        }
        return resolvedId;
    }
    async loadEntryModule(unresolvedId, isEntry, importer, implicitlyLoadedBefore, isLoadForManualChunks = false) {
        const resolveIdResult = await resolveId(unresolvedId, importer, this.options.preserveSymlinks, this.pluginDriver, this.resolveId, null, EMPTY_OBJECT, true, EMPTY_OBJECT);
        if (resolveIdResult == null) {
            return error(implicitlyLoadedBefore === null
                ? logUnresolvedEntry(unresolvedId)
                : logUnresolvedImplicitDependant(unresolvedId, implicitlyLoadedBefore));
        }
        const isExternalModules = typeof resolveIdResult === 'object' && resolveIdResult.external;
        if (resolveIdResult === false || isExternalModules) {
            return error(implicitlyLoadedBefore === null
                ? isExternalModules && isLoadForManualChunks
                    ? logExternalModulesCannotBeIncludedInManualChunks(unresolvedId)
                    : logEntryCannotBeExternal(unresolvedId)
                : logImplicitDependantCannotBeExternal(unresolvedId, implicitlyLoadedBefore));
        }
        return this.fetchModule(this.getResolvedIdWithDefaults(typeof resolveIdResult === 'object'
            ? resolveIdResult
            : { id: resolveIdResult }, EMPTY_OBJECT), undefined, isEntry, false);
    }
    async resolveDynamicImport(module, specifier, importer, assertions) {
        const resolution = await this.pluginDriver.hookFirst('resolveDynamicImport', [
            specifier,
            importer,
            { assertions }
        ]);
        if (typeof specifier !== 'string') {
            if (typeof resolution === 'string') {
                return resolution;
            }
            if (!resolution) {
                return null;
            }
            return this.getResolvedIdWithDefaults(resolution, assertions);
        }
        if (resolution == null) {
            const existingResolution = module.resolvedIds[specifier];
            if (existingResolution) {
                if (doAssertionsDiffer(existingResolution.assertions, assertions)) {
                    this.options.onLog(LOGLEVEL_WARN, logInconsistentImportAssertions(existingResolution.assertions, assertions, specifier, importer));
                }
                return existingResolution;
            }
            return (module.resolvedIds[specifier] = this.handleInvalidResolvedId(await this.resolveId(specifier, module.id, EMPTY_OBJECT, false, assertions), specifier, module.id, assertions));
        }
        return this.handleInvalidResolvedId(this.getResolvedIdWithDefaults(this.getNormalizedResolvedIdWithoutDefaults(resolution, importer, specifier), assertions), specifier, importer, assertions);
    }
}
function normalizeRelativeExternalId(source, importer) {
    return isRelative(source)
        ? importer
            ? resolve(importer, '..', source)
            : resolve(source)
        : source;
}
function addChunkNamesToModule(module, { fileName, name }, isUserDefined, priority) {
    if (fileName !== null) {
        module.chunkFileNames.add(fileName);
    }
    else if (name !== null) {
        // Always keep chunkNames sorted by priority
        let namePosition = 0;
        while (module.chunkNames[namePosition]?.priority < priority)
            namePosition++;
        module.chunkNames.splice(namePosition, 0, { isUserDefined, name, priority });
    }
}
function isNotAbsoluteExternal(id, source, makeAbsoluteExternalsRelative) {
    return (makeAbsoluteExternalsRelative === true ||
        (makeAbsoluteExternalsRelative === 'ifRelativeSource' && isRelative(source)) ||
        !isAbsolute(id));
}
async function waitForDependencyResolution(loadPromise) {
    const [resolveStaticDependencyPromises, resolveDynamicImportPromises] = await loadPromise;
    return Promise.all([...resolveStaticDependencyPromises, ...resolveDynamicImportPromises]);
}

class GlobalScope extends Scope$1 {
    constructor() {
        super();
        this.parent = null;
        this.variables.set('undefined', new UndefinedVariable());
    }
    findVariable(name) {
        let variable = this.variables.get(name);
        if (!variable) {
            variable = new GlobalVariable(name);
            this.variables.set(name, variable);
        }
        return variable;
    }
}

function getSourceHash(source) {
    return createHash().update(source).digest('hex');
}
function generateAssetFileName(name, source, sourceHash, outputOptions, bundle) {
    const emittedName = outputOptions.sanitizeFileName(name || 'asset');
    return makeUnique(renderNamePattern(typeof outputOptions.assetFileNames === 'function'
        ? outputOptions.assetFileNames({ name, source, type: 'asset' })
        : outputOptions.assetFileNames, 'output.assetFileNames', {
        ext: () => extname(emittedName).slice(1),
        extname: () => extname(emittedName),
        hash: size => sourceHash.slice(0, Math.max(0, size || defaultHashSize)),
        name: () => emittedName.slice(0, Math.max(0, emittedName.length - extname(emittedName).length))
    }), bundle);
}
function reserveFileNameInBundle(fileName, { bundle }, log) {
    if (bundle[lowercaseBundleKeys].has(fileName.toLowerCase())) {
        log(LOGLEVEL_WARN, logFileNameConflict(fileName));
    }
    else {
        bundle[fileName] = FILE_PLACEHOLDER;
    }
}
const emittedFileTypes = new Set(['chunk', 'asset', 'prebuilt-chunk']);
function hasValidType(emittedFile) {
    return Boolean(emittedFile &&
        emittedFileTypes.has(emittedFile.type));
}
function hasValidName(emittedFile) {
    const validatedName = emittedFile.fileName || emittedFile.name;
    return !validatedName || (typeof validatedName === 'string' && !isPathFragment(validatedName));
}
function getValidSource(source, emittedFile, fileReferenceId) {
    if (!(typeof source === 'string' || source instanceof Uint8Array)) {
        const assetName = emittedFile.fileName || emittedFile.name || fileReferenceId;
        return error(logFailedValidation(`Could not set source for ${typeof assetName === 'string' ? `asset "${assetName}"` : 'unnamed asset'}, asset source needs to be a string, Uint8Array or Buffer.`));
    }
    return source;
}
function getAssetFileName(file, referenceId) {
    if (typeof file.fileName !== 'string') {
        return error(logAssetNotFinalisedForFileName(file.name || referenceId));
    }
    return file.fileName;
}
function getChunkFileName(file, facadeChunkByModule) {
    if (file.fileName) {
        return file.fileName;
    }
    if (facadeChunkByModule) {
        return facadeChunkByModule.get(file.module).getFileName();
    }
    return error(logChunkNotGeneratedForFileName(file.fileName || file.name));
}
class FileEmitter {
    constructor(graph, options, baseFileEmitter) {
        this.graph = graph;
        this.options = options;
        this.facadeChunkByModule = null;
        this.nextIdBase = 1;
        this.output = null;
        this.outputFileEmitters = [];
        this.emitFile = (emittedFile) => {
            if (!hasValidType(emittedFile)) {
                return error(logFailedValidation(`Emitted files must be of type "asset", "chunk" or "prebuilt-chunk", received "${emittedFile && emittedFile.type}".`));
            }
            if (emittedFile.type === 'prebuilt-chunk') {
                return this.emitPrebuiltChunk(emittedFile);
            }
            if (!hasValidName(emittedFile)) {
                return error(logFailedValidation(`The "fileName" or "name" properties of emitted chunks and assets must be strings that are neither absolute nor relative paths, received "${emittedFile.fileName || emittedFile.name}".`));
            }
            if (emittedFile.type === 'chunk') {
                return this.emitChunk(emittedFile);
            }
            return this.emitAsset(emittedFile);
        };
        this.finaliseAssets = () => {
            for (const [referenceId, emittedFile] of this.filesByReferenceId) {
                if (emittedFile.type === 'asset' && typeof emittedFile.fileName !== 'string')
                    return error(logNoAssetSourceSet(emittedFile.name || referenceId));
            }
        };
        this.getFileName = (fileReferenceId) => {
            const emittedFile = this.filesByReferenceId.get(fileReferenceId);
            if (!emittedFile)
                return error(logFileReferenceIdNotFoundForFilename(fileReferenceId));
            if (emittedFile.type === 'chunk') {
                return getChunkFileName(emittedFile, this.facadeChunkByModule);
            }
            if (emittedFile.type === 'prebuilt-chunk') {
                return emittedFile.fileName;
            }
            return getAssetFileName(emittedFile, fileReferenceId);
        };
        this.setAssetSource = (referenceId, requestedSource) => {
            const consumedFile = this.filesByReferenceId.get(referenceId);
            if (!consumedFile)
                return error(logAssetReferenceIdNotFoundForSetSource(referenceId));
            if (consumedFile.type !== 'asset') {
                return error(logFailedValidation(`Asset sources can only be set for emitted assets but "${referenceId}" is an emitted chunk.`));
            }
            if (consumedFile.source !== undefined) {
                return error(logAssetSourceAlreadySet(consumedFile.name || referenceId));
            }
            const source = getValidSource(requestedSource, consumedFile, referenceId);
            if (this.output) {
                this.finalizeAdditionalAsset(consumedFile, source, this.output);
            }
            else {
                consumedFile.source = source;
                for (const emitter of this.outputFileEmitters) {
                    emitter.finalizeAdditionalAsset(consumedFile, source, emitter.output);
                }
            }
        };
        this.setChunkInformation = (facadeChunkByModule) => {
            this.facadeChunkByModule = facadeChunkByModule;
        };
        this.setOutputBundle = (bundle, outputOptions) => {
            const output = (this.output = {
                bundle,
                fileNamesBySource: new Map(),
                outputOptions
            });
            for (const emittedFile of this.filesByReferenceId.values()) {
                if (emittedFile.fileName) {
                    reserveFileNameInBundle(emittedFile.fileName, output, this.options.onLog);
                }
            }
            const consumedAssetsByHash = new Map();
            for (const consumedFile of this.filesByReferenceId.values()) {
                if (consumedFile.type === 'asset' && consumedFile.source !== undefined) {
                    if (consumedFile.fileName) {
                        this.finalizeAdditionalAsset(consumedFile, consumedFile.source, output);
                    }
                    else {
                        const sourceHash = getSourceHash(consumedFile.source);
                        getOrCreate(consumedAssetsByHash, sourceHash, () => []).push(consumedFile);
                    }
                }
                else if (consumedFile.type === 'prebuilt-chunk') {
                    this.output.bundle[consumedFile.fileName] = this.createPrebuiltChunk(consumedFile);
                }
            }
            for (const [sourceHash, consumedFiles] of consumedAssetsByHash) {
                this.finalizeAssetsWithSameSource(consumedFiles, sourceHash, output);
            }
        };
        this.filesByReferenceId = baseFileEmitter
            ? new Map(baseFileEmitter.filesByReferenceId)
            : new Map();
        baseFileEmitter?.addOutputFileEmitter(this);
    }
    addOutputFileEmitter(outputFileEmitter) {
        this.outputFileEmitters.push(outputFileEmitter);
    }
    assignReferenceId(file, idBase) {
        let referenceId = idBase;
        do {
            referenceId = createHash().update(referenceId).digest('hex').slice(0, 8);
        } while (this.filesByReferenceId.has(referenceId) ||
            this.outputFileEmitters.some(({ filesByReferenceId }) => filesByReferenceId.has(referenceId)));
        file.referenceId = referenceId;
        this.filesByReferenceId.set(referenceId, file);
        for (const { filesByReferenceId } of this.outputFileEmitters) {
            filesByReferenceId.set(referenceId, file);
        }
        return referenceId;
    }
    createPrebuiltChunk(prebuiltChunk) {
        return {
            code: prebuiltChunk.code,
            dynamicImports: [],
            exports: prebuiltChunk.exports || [],
            facadeModuleId: null,
            fileName: prebuiltChunk.fileName,
            implicitlyLoadedBefore: [],
            importedBindings: {},
            imports: [],
            isDynamicEntry: false,
            isEntry: false,
            isImplicitEntry: false,
            map: prebuiltChunk.map || null,
            moduleIds: [],
            modules: {},
            name: prebuiltChunk.fileName,
            preliminaryFileName: prebuiltChunk.fileName,
            referencedFiles: [],
            sourcemapFileName: prebuiltChunk.sourcemapFileName || null,
            type: 'chunk'
        };
    }
    emitAsset(emittedAsset) {
        const source = emittedAsset.source === undefined
            ? undefined
            : getValidSource(emittedAsset.source, emittedAsset, null);
        const consumedAsset = {
            fileName: emittedAsset.fileName,
            name: emittedAsset.name,
            needsCodeReference: !!emittedAsset.needsCodeReference,
            referenceId: '',
            source,
            type: 'asset'
        };
        const referenceId = this.assignReferenceId(consumedAsset, emittedAsset.fileName || emittedAsset.name || String(this.nextIdBase++));
        if (this.output) {
            this.emitAssetWithReferenceId(consumedAsset, this.output);
        }
        else {
            for (const fileEmitter of this.outputFileEmitters) {
                fileEmitter.emitAssetWithReferenceId(consumedAsset, fileEmitter.output);
            }
        }
        return referenceId;
    }
    emitAssetWithReferenceId(consumedAsset, output) {
        const { fileName, source } = consumedAsset;
        if (fileName) {
            reserveFileNameInBundle(fileName, output, this.options.onLog);
        }
        if (source !== undefined) {
            this.finalizeAdditionalAsset(consumedAsset, source, output);
        }
    }
    emitChunk(emittedChunk) {
        if (this.graph.phase > BuildPhase.LOAD_AND_PARSE) {
            return error(logInvalidRollupPhaseForChunkEmission());
        }
        if (typeof emittedChunk.id !== 'string') {
            return error(logFailedValidation(`Emitted chunks need to have a valid string id, received "${emittedChunk.id}"`));
        }
        const consumedChunk = {
            fileName: emittedChunk.fileName,
            module: null,
            name: emittedChunk.name || emittedChunk.id,
            referenceId: '',
            type: 'chunk'
        };
        this.graph.moduleLoader
            .emitChunk(emittedChunk)
            .then(module => (consumedChunk.module = module))
            .catch(() => {
            // Avoid unhandled Promise rejection as the error will be thrown later
            // once module loading has finished
        });
        return this.assignReferenceId(consumedChunk, emittedChunk.id);
    }
    emitPrebuiltChunk(emitPrebuiltChunk) {
        if (typeof emitPrebuiltChunk.code !== 'string') {
            return error(logFailedValidation(`Emitted prebuilt chunks need to have a valid string code, received "${emitPrebuiltChunk.code}".`));
        }
        if (typeof emitPrebuiltChunk.fileName !== 'string' ||
            isPathFragment(emitPrebuiltChunk.fileName)) {
            return error(logFailedValidation(`The "fileName" property of emitted prebuilt chunks must be strings that are neither absolute nor relative paths, received "${emitPrebuiltChunk.fileName}".`));
        }
        const consumedPrebuiltChunk = {
            code: emitPrebuiltChunk.code,
            exports: emitPrebuiltChunk.exports,
            fileName: emitPrebuiltChunk.fileName,
            map: emitPrebuiltChunk.map,
            referenceId: '',
            type: 'prebuilt-chunk'
        };
        const referenceId = this.assignReferenceId(consumedPrebuiltChunk, consumedPrebuiltChunk.fileName);
        if (this.output) {
            this.output.bundle[consumedPrebuiltChunk.fileName] =
                this.createPrebuiltChunk(consumedPrebuiltChunk);
        }
        return referenceId;
    }
    finalizeAdditionalAsset(consumedFile, source, { bundle, fileNamesBySource, outputOptions }) {
        let { fileName, needsCodeReference, referenceId } = consumedFile;
        // Deduplicate assets if an explicit fileName is not provided
        if (!fileName) {
            const sourceHash = getSourceHash(source);
            fileName = fileNamesBySource.get(sourceHash);
            if (!fileName) {
                fileName = generateAssetFileName(consumedFile.name, source, sourceHash, outputOptions, bundle);
                fileNamesBySource.set(sourceHash, fileName);
            }
        }
        // We must not modify the original assets to avoid interaction between outputs
        const assetWithFileName = { ...consumedFile, fileName, source };
        this.filesByReferenceId.set(referenceId, assetWithFileName);
        const existingAsset = bundle[fileName];
        if (existingAsset?.type === 'asset') {
            existingAsset.needsCodeReference && (existingAsset.needsCodeReference = needsCodeReference);
        }
        else {
            bundle[fileName] = {
                fileName,
                name: consumedFile.name,
                needsCodeReference,
                source,
                type: 'asset'
            };
        }
    }
    finalizeAssetsWithSameSource(consumedFiles, sourceHash, { bundle, fileNamesBySource, outputOptions }) {
        let fileName = '';
        let usedConsumedFile;
        let needsCodeReference = true;
        for (const consumedFile of consumedFiles) {
            needsCodeReference && (needsCodeReference = consumedFile.needsCodeReference);
            const assetFileName = generateAssetFileName(consumedFile.name, consumedFile.source, sourceHash, outputOptions, bundle);
            if (!fileName ||
                assetFileName.length < fileName.length ||
                (assetFileName.length === fileName.length && assetFileName < fileName)) {
                fileName = assetFileName;
                usedConsumedFile = consumedFile;
            }
        }
        fileNamesBySource.set(sourceHash, fileName);
        for (const consumedFile of consumedFiles) {
            // We must not modify the original assets to avoid interaction between outputs
            const assetWithFileName = { ...consumedFile, fileName };
            this.filesByReferenceId.set(consumedFile.referenceId, assetWithFileName);
        }
        bundle[fileName] = {
            fileName,
            name: usedConsumedFile.name,
            needsCodeReference,
            source: usedConsumedFile.source,
            type: 'asset'
        };
    }
}

function getLogHandler(level, code, logger, pluginName, logLevel) {
    if (logLevelPriority[level] < logLevelPriority[logLevel]) {
        return doNothing;
    }
    return (log, pos) => {
        if (pos != null) {
            logger(LOGLEVEL_WARN, logInvalidLogPosition(pluginName));
        }
        log = normalizeLog(log);
        if (log.code && !log.pluginCode) {
            log.pluginCode = log.code;
        }
        log.code = code;
        log.plugin = pluginName;
        logger(level, log);
    };
}

function getPluginContext(plugin, pluginCache, graph, options, fileEmitter, existingPluginNames) {
    const { logLevel, onLog } = options;
    let cacheable = true;
    if (typeof plugin.cacheKey !== 'string') {
        if (plugin.name.startsWith(ANONYMOUS_PLUGIN_PREFIX) ||
            plugin.name.startsWith(ANONYMOUS_OUTPUT_PLUGIN_PREFIX) ||
            existingPluginNames.has(plugin.name)) {
            cacheable = false;
        }
        else {
            existingPluginNames.add(plugin.name);
        }
    }
    let cacheInstance;
    if (!pluginCache) {
        cacheInstance = NO_CACHE;
    }
    else if (cacheable) {
        const cacheKey = plugin.cacheKey || plugin.name;
        cacheInstance = createPluginCache(pluginCache[cacheKey] || (pluginCache[cacheKey] = Object.create(null)));
    }
    else {
        cacheInstance = getCacheForUncacheablePlugin(plugin.name);
    }
    return {
        addWatchFile(id) {
            if (graph.phase >= BuildPhase.GENERATE) {
                return this.error(logInvalidRollupPhaseForAddWatchFile());
            }
            graph.watchFiles[id] = true;
        },
        cache: cacheInstance,
        debug: getLogHandler(LOGLEVEL_DEBUG, 'PLUGIN_LOG', onLog, plugin.name, logLevel),
        emitFile: fileEmitter.emitFile.bind(fileEmitter),
        error(error_) {
            return error(logPluginError(normalizeLog(error_), plugin.name));
        },
        getFileName: fileEmitter.getFileName,
        getModuleIds: () => graph.modulesById.keys(),
        getModuleInfo: graph.getModuleInfo,
        getWatchFiles: () => Object.keys(graph.watchFiles),
        info: getLogHandler(LOGLEVEL_INFO, 'PLUGIN_LOG', onLog, plugin.name, logLevel),
        load(resolvedId) {
            return graph.moduleLoader.preloadModule(resolvedId);
        },
        meta: {
            rollupVersion: version$1,
            watchMode: graph.watchMode
        },
        get moduleIds() {
            function* wrappedModuleIds() {
                // We are wrapping this in a generator to only show the message once we are actually iterating
                warnDeprecation(`Accessing "this.moduleIds" on the plugin context by plugin ${plugin.name} is deprecated. The "this.getModuleIds" plugin context function should be used instead.`, URL_THIS_GETMODULEIDS, true, options, plugin.name);
                yield* moduleIds;
            }
            const moduleIds = graph.modulesById.keys();
            return wrappedModuleIds();
        },
        parse: graph.contextParse.bind(graph),
        resolve(source, importer, { assertions, custom, isEntry, skipSelf } = BLANK) {
            return graph.moduleLoader.resolveId(source, importer, custom, isEntry, assertions || EMPTY_OBJECT, skipSelf ? [{ importer, plugin, source }] : null);
        },
        setAssetSource: fileEmitter.setAssetSource,
        warn: getLogHandler(LOGLEVEL_WARN, 'PLUGIN_WARNING', onLog, plugin.name, logLevel)
    };
}

// This will make sure no input hook is omitted
const inputHookNames = {
    buildEnd: 1,
    buildStart: 1,
    closeBundle: 1,
    closeWatcher: 1,
    load: 1,
    moduleParsed: 1,
    onLog: 1,
    options: 1,
    resolveDynamicImport: 1,
    resolveId: 1,
    shouldTransformCachedModule: 1,
    transform: 1,
    watchChange: 1
};
const inputHooks = Object.keys(inputHookNames);
class PluginDriver {
    constructor(graph, options, userPlugins, pluginCache, basePluginDriver) {
        this.graph = graph;
        this.options = options;
        this.pluginCache = pluginCache;
        this.sortedPlugins = new Map();
        this.unfulfilledActions = new Set();
        this.fileEmitter = new FileEmitter(graph, options, basePluginDriver && basePluginDriver.fileEmitter);
        this.emitFile = this.fileEmitter.emitFile.bind(this.fileEmitter);
        this.getFileName = this.fileEmitter.getFileName.bind(this.fileEmitter);
        this.finaliseAssets = this.fileEmitter.finaliseAssets.bind(this.fileEmitter);
        this.setChunkInformation = this.fileEmitter.setChunkInformation.bind(this.fileEmitter);
        this.setOutputBundle = this.fileEmitter.setOutputBundle.bind(this.fileEmitter);
        this.plugins = [...(basePluginDriver ? basePluginDriver.plugins : []), ...userPlugins];
        const existingPluginNames = new Set();
        this.pluginContexts = new Map(this.plugins.map(plugin => [
            plugin,
            getPluginContext(plugin, pluginCache, graph, options, this.fileEmitter, existingPluginNames)
        ]));
        if (basePluginDriver) {
            for (const plugin of userPlugins) {
                for (const hook of inputHooks) {
                    if (hook in plugin) {
                        options.onLog(LOGLEVEL_WARN, logInputHookInOutputPlugin(plugin.name, hook));
                    }
                }
            }
        }
    }
    createOutputPluginDriver(plugins) {
        return new PluginDriver(this.graph, this.options, plugins, this.pluginCache, this);
    }
    getUnfulfilledHookActions() {
        return this.unfulfilledActions;
    }
    // chains, first non-null result stops and returns
    hookFirst(hookName, parameters, replaceContext, skipped) {
        return this.hookFirstAndGetPlugin(hookName, parameters, replaceContext, skipped).then(result => result && result[0]);
    }
    // chains, first non-null result stops and returns result and last plugin
    async hookFirstAndGetPlugin(hookName, parameters, replaceContext, skipped) {
        for (const plugin of this.getSortedPlugins(hookName)) {
            if (skipped?.has(plugin))
                continue;
            const result = await this.runHook(hookName, parameters, plugin, replaceContext);
            if (result != null)
                return [result, plugin];
        }
        return null;
    }
    // chains synchronously, first non-null result stops and returns
    hookFirstSync(hookName, parameters, replaceContext) {
        for (const plugin of this.getSortedPlugins(hookName)) {
            const result = this.runHookSync(hookName, parameters, plugin, replaceContext);
            if (result != null)
                return result;
        }
        return null;
    }
    // parallel, ignores returns
    async hookParallel(hookName, parameters, replaceContext) {
        const parallelPromises = [];
        for (const plugin of this.getSortedPlugins(hookName)) {
            if (plugin[hookName].sequential) {
                await Promise.all(parallelPromises);
                parallelPromises.length = 0;
                await this.runHook(hookName, parameters, plugin, replaceContext);
            }
            else {
                parallelPromises.push(this.runHook(hookName, parameters, plugin, replaceContext));
            }
        }
        await Promise.all(parallelPromises);
    }
    // chains, reduces returned value, handling the reduced value as the first hook argument
    hookReduceArg0(hookName, [argument0, ...rest], reduce, replaceContext) {
        let promise = Promise.resolve(argument0);
        for (const plugin of this.getSortedPlugins(hookName)) {
            promise = promise.then(argument0 => this.runHook(hookName, [argument0, ...rest], plugin, replaceContext).then(result => reduce.call(this.pluginContexts.get(plugin), argument0, result, plugin)));
        }
        return promise;
    }
    // chains synchronously, reduces returned value, handling the reduced value as the first hook argument
    hookReduceArg0Sync(hookName, [argument0, ...rest], reduce, replaceContext) {
        for (const plugin of this.getSortedPlugins(hookName)) {
            const parameters = [argument0, ...rest];
            const result = this.runHookSync(hookName, parameters, plugin, replaceContext);
            argument0 = reduce.call(this.pluginContexts.get(plugin), argument0, result, plugin);
        }
        return argument0;
    }
    // chains, reduces returned value to type string, handling the reduced value separately. permits hooks as values.
    async hookReduceValue(hookName, initialValue, parameters, reducer) {
        const results = [];
        const parallelResults = [];
        for (const plugin of this.getSortedPlugins(hookName, validateAddonPluginHandler)) {
            if (plugin[hookName].sequential) {
                results.push(...(await Promise.all(parallelResults)));
                parallelResults.length = 0;
                results.push(await this.runHook(hookName, parameters, plugin));
            }
            else {
                parallelResults.push(this.runHook(hookName, parameters, plugin));
            }
        }
        results.push(...(await Promise.all(parallelResults)));
        return results.reduce(reducer, await initialValue);
    }
    // chains synchronously, reduces returned value to type T, handling the reduced value separately. permits hooks as values.
    hookReduceValueSync(hookName, initialValue, parameters, reduce, replaceContext) {
        let accumulator = initialValue;
        for (const plugin of this.getSortedPlugins(hookName)) {
            const result = this.runHookSync(hookName, parameters, plugin, replaceContext);
            accumulator = reduce.call(this.pluginContexts.get(plugin), accumulator, result, plugin);
        }
        return accumulator;
    }
    // chains, ignores returns
    hookSeq(hookName, parameters, replaceContext) {
        let promise = Promise.resolve();
        for (const plugin of this.getSortedPlugins(hookName)) {
            promise = promise.then(() => this.runHook(hookName, parameters, plugin, replaceContext));
        }
        return promise.then(noReturn);
    }
    getSortedPlugins(hookName, validateHandler) {
        return getOrCreate(this.sortedPlugins, hookName, () => getSortedValidatedPlugins(hookName, this.plugins, validateHandler));
    }
    // Implementation signature
    runHook(hookName, parameters, plugin, replaceContext) {
        // We always filter for plugins that support the hook before running it
        const hook = plugin[hookName];
        const handler = typeof hook === 'object' ? hook.handler : hook;
        let context = this.pluginContexts.get(plugin);
        if (replaceContext) {
            context = replaceContext(context, plugin);
        }
        let action = null;
        return Promise.resolve()
            .then(() => {
            if (typeof handler !== 'function') {
                return handler;
            }
            // eslint-disable-next-line @typescript-eslint/ban-types
            const hookResult = handler.apply(context, parameters);
            if (!hookResult?.then) {
                // short circuit for non-thenables and non-Promises
                return hookResult;
            }
            // Track pending hook actions to properly error out when
            // unfulfilled promises cause rollup to abruptly and confusingly
            // exit with a successful 0 return code but without producing any
            // output, errors or warnings.
            action = [plugin.name, hookName, parameters];
            this.unfulfilledActions.add(action);
            // Although it would be more elegant to just return hookResult here
            // and put the .then() handler just above the .catch() handler below,
            // doing so would subtly change the defacto async event dispatch order
            // which at least one test and some plugins in the wild may depend on.
            return Promise.resolve(hookResult).then(result => {
                // action was fulfilled
                this.unfulfilledActions.delete(action);
                return result;
            });
        })
            .catch(error_ => {
            if (action !== null) {
                // action considered to be fulfilled since error being handled
                this.unfulfilledActions.delete(action);
            }
            return error(logPluginError(error_, plugin.name, { hook: hookName }));
        });
    }
    /**
     * Run a sync plugin hook and return the result.
     * @param hookName Name of the plugin hook. Must be in `PluginHooks`.
     * @param args Arguments passed to the plugin hook.
     * @param plugin The acutal plugin
     * @param replaceContext When passed, the plugin context can be overridden.
     */
    runHookSync(hookName, parameters, plugin, replaceContext) {
        const hook = plugin[hookName];
        const handler = typeof hook === 'object' ? hook.handler : hook;
        let context = this.pluginContexts.get(plugin);
        if (replaceContext) {
            context = replaceContext(context, plugin);
        }
        try {
            // eslint-disable-next-line @typescript-eslint/ban-types
            return handler.apply(context, parameters);
        }
        catch (error_) {
            return error(logPluginError(error_, plugin.name, { hook: hookName }));
        }
    }
}
function getSortedValidatedPlugins(hookName, plugins, validateHandler = validateFunctionPluginHandler) {
    const pre = [];
    const normal = [];
    const post = [];
    for (const plugin of plugins) {
        const hook = plugin[hookName];
        if (hook) {
            if (typeof hook === 'object') {
                validateHandler(hook.handler, hookName, plugin);
                if (hook.order === 'pre') {
                    pre.push(plugin);
                    continue;
                }
                if (hook.order === 'post') {
                    post.push(plugin);
                    continue;
                }
            }
            else {
                validateHandler(hook, hookName, plugin);
            }
            normal.push(plugin);
        }
    }
    return [...pre, ...normal, ...post];
}
function validateFunctionPluginHandler(handler, hookName, plugin) {
    if (typeof handler !== 'function') {
        error(logInvalidFunctionPluginHook(hookName, plugin.name));
    }
}
function validateAddonPluginHandler(handler, hookName, plugin) {
    if (typeof handler !== 'string' && typeof handler !== 'function') {
        return error(logInvalidAddonPluginHook(hookName, plugin.name));
    }
}
function noReturn() { }

class Queue {
    constructor(maxParallel) {
        this.maxParallel = maxParallel;
        this.queue = [];
        this.workerCount = 0;
    }
    run(task) {
        return new Promise((resolve, reject) => {
            this.queue.push({ reject, resolve, task });
            this.work();
        });
    }
    async work() {
        if (this.workerCount >= this.maxParallel)
            return;
        this.workerCount++;
        let entry;
        while ((entry = this.queue.shift())) {
            const { reject, resolve, task } = entry;
            try {
                const result = await task();
                resolve(result);
            }
            catch (error) {
                reject(error);
            }
        }
        this.workerCount--;
    }
}

function normalizeEntryModules(entryModules) {
    if (Array.isArray(entryModules)) {
        return entryModules.map(id => ({
            fileName: null,
            id,
            implicitlyLoadedAfter: [],
            importer: undefined,
            name: null
        }));
    }
    return Object.entries(entryModules).map(([name, id]) => ({
        fileName: null,
        id,
        implicitlyLoadedAfter: [],
        importer: undefined,
        name
    }));
}
class Graph {
    constructor(options, watcher) {
        this.options = options;
        this.astLru = flru(5);
        this.cachedModules = new Map();
        this.deoptimizationTracker = new PathTracker();
        this.entryModules = [];
        this.modulesById = new Map();
        this.needsTreeshakingPass = false;
        this.phase = BuildPhase.LOAD_AND_PARSE;
        this.scope = new GlobalScope();
        this.watchFiles = Object.create(null);
        this.watchMode = false;
        this.externalModules = [];
        this.implicitEntryModules = [];
        this.modules = [];
        this.getModuleInfo = (moduleId) => {
            const foundModule = this.modulesById.get(moduleId);
            if (!foundModule)
                return null;
            return foundModule.info;
        };
        if (options.cache !== false) {
            if (options.cache?.modules) {
                for (const module of options.cache.modules)
                    this.cachedModules.set(module.id, module);
            }
            this.pluginCache = options.cache?.plugins || Object.create(null);
            // increment access counter
            for (const name in this.pluginCache) {
                const cache = this.pluginCache[name];
                for (const value of Object.values(cache))
                    value[0]++;
            }
        }
        if (watcher) {
            this.watchMode = true;
            const handleChange = (...parameters) => this.pluginDriver.hookParallel('watchChange', parameters);
            const handleClose = () => this.pluginDriver.hookParallel('closeWatcher', []);
            watcher.onCurrentRun('change', handleChange);
            watcher.onCurrentRun('close', handleClose);
        }
        this.pluginDriver = new PluginDriver(this, options, options.plugins, this.pluginCache);
        this.acornParser = Parser.extend(...options.acornInjectPlugins);
        this.moduleLoader = new ModuleLoader(this, this.modulesById, this.options, this.pluginDriver);
        this.fileOperationQueue = new Queue(options.maxParallelFileOps);
        this.pureFunctions = getPureFunctions(options);
    }
    async build() {
        timeStart('generate module graph', 2);
        await this.generateModuleGraph();
        timeEnd('generate module graph', 2);
        timeStart('sort and bind modules', 2);
        this.phase = BuildPhase.ANALYSE;
        this.sortModules();
        timeEnd('sort and bind modules', 2);
        timeStart('mark included statements', 2);
        this.includeStatements();
        timeEnd('mark included statements', 2);
        this.phase = BuildPhase.GENERATE;
    }
    contextParse(code, options = {}) {
        const onCommentOrig = options.onComment;
        const comments = [];
        options.onComment =
            onCommentOrig && typeof onCommentOrig == 'function'
                ? (block, text, start, end, ...parameters) => {
                    comments.push({ end, start, type: block ? 'Block' : 'Line', value: text });
                    return onCommentOrig.call(options, block, text, start, end, ...parameters);
                }
                : comments;
        const ast = this.acornParser.parse(code, {
            ...this.options.acorn,
            ...options
        });
        if (typeof onCommentOrig == 'object') {
            onCommentOrig.push(...comments);
        }
        options.onComment = onCommentOrig;
        addAnnotations(comments, ast, code);
        return ast;
    }
    getCache() {
        // handle plugin cache eviction
        for (const name in this.pluginCache) {
            const cache = this.pluginCache[name];
            let allDeleted = true;
            for (const [key, value] of Object.entries(cache)) {
                if (value[0] >= this.options.experimentalCacheExpiry)
                    delete cache[key];
                else
                    allDeleted = false;
            }
            if (allDeleted)
                delete this.pluginCache[name];
        }
        return {
            modules: this.modules.map(module => module.toJSON()),
            plugins: this.pluginCache
        };
    }
    async generateModuleGraph() {
        ({ entryModules: this.entryModules, implicitEntryModules: this.implicitEntryModules } =
            await this.moduleLoader.addEntryModules(normalizeEntryModules(this.options.input), true));
        if (this.entryModules.length === 0) {
            throw new Error('You must supply options.input to rollup');
        }
        for (const module of this.modulesById.values()) {
            if (module instanceof Module) {
                this.modules.push(module);
            }
            else {
                this.externalModules.push(module);
            }
        }
    }
    includeStatements() {
        const entryModules = [...this.entryModules, ...this.implicitEntryModules];
        for (const module of entryModules) {
            markModuleAndImpureDependenciesAsExecuted(module);
        }
        if (this.options.treeshake) {
            let treeshakingPass = 1;
            do {
                timeStart(`treeshaking pass ${treeshakingPass}`, 3);
                this.needsTreeshakingPass = false;
                for (const module of this.modules) {
                    if (module.isExecuted) {
                        if (module.info.moduleSideEffects === 'no-treeshake') {
                            module.includeAllInBundle();
                        }
                        else {
                            module.include();
                        }
                    }
                }
                if (treeshakingPass === 1) {
                    // We only include exports after the first pass to avoid issues with
                    // the TDZ detection logic
                    for (const module of entryModules) {
                        if (module.preserveSignature !== false) {
                            module.includeAllExports(false);
                            this.needsTreeshakingPass = true;
                        }
                    }
                }
                timeEnd(`treeshaking pass ${treeshakingPass++}`, 3);
            } while (this.needsTreeshakingPass);
        }
        else {
            for (const module of this.modules)
                module.includeAllInBundle();
        }
        for (const externalModule of this.externalModules)
            externalModule.warnUnusedImports();
        for (const module of this.implicitEntryModules) {
            for (const dependant of module.implicitlyLoadedAfter) {
                if (!(dependant.info.isEntry || dependant.isIncluded())) {
                    error(logImplicitDependantIsNotIncluded(dependant));
                }
            }
        }
    }
    sortModules() {
        const { orderedModules, cyclePaths } = analyseModuleExecution(this.entryModules);
        for (const cyclePath of cyclePaths) {
            this.options.onLog(LOGLEVEL_WARN, logCircularDependency(cyclePath));
        }
        this.modules = orderedModules;
        for (const module of this.modules) {
            module.bindReferences();
        }
        this.warnForMissingExports();
    }
    warnForMissingExports() {
        for (const module of this.modules) {
            for (const importDescription of module.importDescriptions.values()) {
                if (importDescription.name !== '*' &&
                    !importDescription.module.getVariableForExportName(importDescription.name)[0]) {
                    module.log(LOGLEVEL_WARN, logMissingExport(importDescription.name, module.id, importDescription.module.id), importDescription.start);
                }
            }
        }
    }
}

function formatAction([pluginName, hookName, parameters]) {
    const action = `(${pluginName}) ${hookName}`;
    const s = JSON.stringify;
    switch (hookName) {
        case 'resolveId': {
            return `${action} ${s(parameters[0])} ${s(parameters[1])}`;
        }
        case 'load': {
            return `${action} ${s(parameters[0])}`;
        }
        case 'transform': {
            return `${action} ${s(parameters[1])}`;
        }
        case 'shouldTransformCachedModule': {
            return `${action} ${s(parameters[0].id)}`;
        }
        case 'moduleParsed': {
            return `${action} ${s(parameters[0].id)}`;
        }
    }
    return action;
}
let handleBeforeExit = null;
const rejectByPluginDriver = new Map();
async function catchUnfinishedHookActions(pluginDriver, callback) {
    const emptyEventLoopPromise = new Promise((_, reject) => {
        rejectByPluginDriver.set(pluginDriver, reject);
        if (!handleBeforeExit) {
            // We only ever create a single event listener to avoid max listener and
            // other issues
            handleBeforeExit = () => {
                for (const [pluginDriver, reject] of rejectByPluginDriver) {
                    const unfulfilledActions = pluginDriver.getUnfulfilledHookActions();
                    reject(new Error(`Unexpected early exit. This happens when Promises returned by plugins cannot resolve. Unfinished hook action(s) on exit:\n` +
                        [...unfulfilledActions].map(formatAction).join('\n')));
                }
            };
            process$1.once('beforeExit', handleBeforeExit);
        }
    });
    try {
        return await Promise.race([callback(), emptyEventLoopPromise]);
    }
    finally {
        rejectByPluginDriver.delete(pluginDriver);
        if (rejectByPluginDriver.size === 0) {
            process$1.off('beforeExit', handleBeforeExit);
            handleBeforeExit = null;
        }
    }
}

function getLogger(plugins, onLog, watchMode, logLevel) {
    plugins = getSortedValidatedPlugins('onLog', plugins);
    const minimalPriority = logLevelPriority[logLevel];
    const logger = (level, log, skipped = EMPTY_SET) => {
        const logPriority = logLevelPriority[level];
        if (logPriority < minimalPriority) {
            return;
        }
        for (const plugin of plugins) {
            if (skipped.has(plugin))
                continue;
            const { onLog: pluginOnLog } = plugin;
            const getLogHandler = (level) => {
                if (logLevelPriority[level] < minimalPriority) {
                    return doNothing;
                }
                return log => logger(level, normalizeLog(log), new Set(skipped).add(plugin));
            };
            const handler = 'handler' in pluginOnLog ? pluginOnLog.handler : pluginOnLog;
            if (handler.call({
                debug: getLogHandler(LOGLEVEL_DEBUG),
                error: (log) => error(normalizeLog(log)),
                info: getLogHandler(LOGLEVEL_INFO),
                meta: { rollupVersion: version$1, watchMode },
                warn: getLogHandler(LOGLEVEL_WARN)
            }, level, log) === false) {
                return;
            }
        }
        onLog(level, log);
    };
    return logger;
}

const leftCurlyBrace = "{".charCodeAt(0);
const space = " ".charCodeAt(0);

const keyword = "assert";
const FUNC_STATEMENT = 1, FUNC_NULLABLE_ID = 4;

function importAssertions(Parser) {
  // Use supplied version acorn version if present, to avoid
  // reference mismatches due to different acorn versions. This
  // allows this plugin to be used with Rollup which supplies
  // its own internal version of acorn and thereby sidesteps
  // the package manager.
  const acorn = Parser.acorn || _acorn;
  const { tokTypes: tt, TokenType } = acorn;

  return class extends Parser {
    constructor(...args) {
      super(...args);
      this.assertToken = new TokenType(keyword);
    }

    _codeAt(i) {
      return this.input.charCodeAt(i);
    }

    _eat(t) {
      if (this.type !== t) {
        this.unexpected();
      }
      this.next();
    }

    readToken(code) {
      let i = 0;
      for (; i < keyword.length; i++) {
        if (this._codeAt(this.pos + i) !== keyword.charCodeAt(i)) {
          return super.readToken(code);
        }
      }

      // ensure that the keyword is at the correct location
      // ie `assert{...` or `assert {...`
      for (;; i++) {
        if (this._codeAt(this.pos + i) === leftCurlyBrace) {
          // Found '{'
          break;
        } else if (this._codeAt(this.pos + i) === space) {
          // white space is allowed between `assert` and `{`, so continue.
          continue;
        } else {
          return super.readToken(code);
        }
      }

      // If we're inside a dynamic import expression we'll parse
      // the `assert` keyword as a standard object property name
      // ie `import(""./foo.json", { assert: { type: "json" } })`
      if (this.type.label === "{") {
        return super.readToken(code);
      }

      this.pos += keyword.length;
      return this.finishToken(this.assertToken);
    }

    parseDynamicImport(node) {
      this.next(); // skip `(`

      // Parse node.source.
      node.source = this.parseMaybeAssign();

      if (this.eat(tt.comma)) {
        const obj = this.parseObj(false);
        node.arguments = [obj];
      }
      this._eat(tt.parenR);
      return this.finishNode(node, "ImportExpression");
    }

    // ported from acorn/src/statement.js pp.parseExport
    parseExport(node, exports) {
      this.next();
      // export * from '...'
      if (this.eat(tt.star)) {
        if (this.options.ecmaVersion >= 11) {
          if (this.eatContextual("as")) {
            node.exported = this.parseIdent(true);
            this.checkExport(exports, node.exported.name, this.lastTokStart);
          } else {
            node.exported = null;
          }
        }
        this.expectContextual("from");
        if (this.type !== tt.string) { this.unexpected(); }
        node.source = this.parseExprAtom();

        if (this.type === this.assertToken || this.type === tt._with) {
          this.next();
          const assertions = this.parseImportAssertions();
          if (assertions) {
            node.assertions = assertions;
          }
        }

        this.semicolon();
        return this.finishNode(node, "ExportAllDeclaration")
      }
      if (this.eat(tt._default)) { // export default ...
        this.checkExport(exports, "default", this.lastTokStart);
        var isAsync;
        if (this.type === tt._function || (isAsync = this.isAsyncFunction())) {
          var fNode = this.startNode();
          this.next();
          if (isAsync) { this.next(); }
          node.declaration = this.parseFunction(fNode, FUNC_STATEMENT | FUNC_NULLABLE_ID, false, isAsync);
        } else if (this.type === tt._class) {
          var cNode = this.startNode();
          node.declaration = this.parseClass(cNode, "nullableID");
        } else {
          node.declaration = this.parseMaybeAssign();
          this.semicolon();
        }
        return this.finishNode(node, "ExportDefaultDeclaration")
      }
      // export var|const|let|function|class ...
      if (this.shouldParseExportStatement()) {
        node.declaration = this.parseStatement(null);
        if (node.declaration.type === "VariableDeclaration")
          { this.checkVariableExport(exports, node.declaration.declarations); }
        else
          { this.checkExport(exports, node.declaration.id.name, node.declaration.id.start); }
        node.specifiers = [];
        node.source = null;
      } else { // export { x, y as z } [from '...']
        node.declaration = null;
        node.specifiers = this.parseExportSpecifiers(exports);
        if (this.eatContextual("from")) {
          if (this.type !== tt.string) { this.unexpected(); }
          node.source = this.parseExprAtom();

          if (this.type === this.assertToken || this.type === tt._with) {
            this.next();
            const assertions = this.parseImportAssertions();
            if (assertions) {
              node.assertions = assertions;
            }
          }
        } else {
          for (var i = 0, list = node.specifiers; i < list.length; i += 1) {
            // check for keywords used as local names
            var spec = list[i];

            this.checkUnreserved(spec.local);
            // check if export is defined
            this.checkLocalExport(spec.local);
          }

          node.source = null;
        }
        this.semicolon();
      }
      return this.finishNode(node, "ExportNamedDeclaration")
    }

    parseImport(node) {
      this.next();
      // import '...'
      if (this.type === tt.string) {
        node.specifiers = [];
        node.source = this.parseExprAtom();
      } else {
        node.specifiers = this.parseImportSpecifiers();
        this.expectContextual("from");
        node.source =
          this.type === tt.string ? this.parseExprAtom() : this.unexpected();
      }

      if (this.type === this.assertToken || this.type == tt._with) {
        this.next();
        const assertions = this.parseImportAssertions();
        if (assertions) {
          node.assertions = assertions;
        }
      }
      this.semicolon();
      return this.finishNode(node, "ImportDeclaration");
    }

    parseImportAssertions() {
      this._eat(tt.braceL);
      const attrs = this.parseAssertEntries();
      this._eat(tt.braceR);
      return attrs;
    }

    parseAssertEntries() {
      const attrs = [];
      const attrNames = new Set();

      do {
        if (this.type === tt.braceR) {
          break;
        }

        const node = this.startNode();

        // parse AssertionKey : IdentifierName, StringLiteral
        let assertionKeyNode;
        if (this.type === tt.string) {
          assertionKeyNode = this.parseLiteral(this.value);
        } else {
          assertionKeyNode = this.parseIdent(true);
        }
        this.next();
        node.key = assertionKeyNode;

        // check if we already have an entry for an attribute
        // if a duplicate entry is found, throw an error
        // for now this logic will come into play only when someone declares `type` twice
        if (attrNames.has(node.key.name)) {
          this.raise(this.pos, "Duplicated key in assertions");
        }
        attrNames.add(node.key.name);

        if (this.type !== tt.string) {
          this.raise(
            this.pos,
            "Only string is supported as an assertion value"
          );
        }

        node.value = this.parseLiteral(this.value);

        attrs.push(this.finishNode(node, "ImportAttribute"));
      } while (this.eat(tt.comma));

      return attrs;
    }
  };
}

function ensureArray(items) {
    if (Array.isArray(items)) {
        return items.filter(Boolean);
    }
    if (items) {
        return [items];
    }
    return [];
}

async function normalizeInputOptions(config, watchMode) {
    // These are options that may trigger special warnings or behaviour later
    // if the user did not select an explicit value
    const unsetOptions = new Set();
    const context = config.context ?? 'undefined';
    const plugins = await normalizePluginOption(config.plugins);
    const logLevel = config.logLevel || LOGLEVEL_INFO;
    const onLog = getLogger(plugins, getOnLog(config, logLevel), watchMode, logLevel);
    const strictDeprecations = config.strictDeprecations || false;
    const maxParallelFileOps = getMaxParallelFileOps(config, onLog, strictDeprecations);
    const options = {
        acorn: getAcorn(config),
        acornInjectPlugins: getAcornInjectPlugins(config),
        cache: getCache(config),
        context,
        experimentalCacheExpiry: config.experimentalCacheExpiry ?? 10,
        experimentalLogSideEffects: config.experimentalLogSideEffects || false,
        external: getIdMatcher(config.external),
        inlineDynamicImports: getInlineDynamicImports$1(config, onLog, strictDeprecations),
        input: getInput(config),
        logLevel,
        makeAbsoluteExternalsRelative: config.makeAbsoluteExternalsRelative ?? 'ifRelativeSource',
        manualChunks: getManualChunks$1(config, onLog, strictDeprecations),
        maxParallelFileOps,
        maxParallelFileReads: maxParallelFileOps,
        moduleContext: getModuleContext(config, context),
        onLog,
        onwarn: warning => onLog(LOGLEVEL_WARN, warning),
        perf: config.perf || false,
        plugins,
        preserveEntrySignatures: config.preserveEntrySignatures ?? 'exports-only',
        preserveModules: getPreserveModules$1(config, onLog, strictDeprecations),
        preserveSymlinks: config.preserveSymlinks || false,
        shimMissingExports: config.shimMissingExports || false,
        strictDeprecations,
        treeshake: getTreeshake(config)
    };
    warnUnknownOptions(config, [...Object.keys(options), 'watch'], 'input options', onLog, /^(output)$/);
    return { options, unsetOptions };
}
const getAcorn = (config) => ({
    ecmaVersion: 'latest',
    sourceType: 'module',
    ...config.acorn
});
const getAcornInjectPlugins = (config) => [
    importAssertions,
    ...ensureArray(config.acornInjectPlugins)
];
const getCache = (config) => config.cache === true // `true` is the default
    ? undefined
    : config.cache?.cache || config.cache;
const getIdMatcher = (option) => {
    if (option === true) {
        return () => true;
    }
    if (typeof option === 'function') {
        return (id, ...parameters) => (!id.startsWith('\0') && option(id, ...parameters)) || false;
    }
    if (option) {
        const ids = new Set();
        const matchers = [];
        for (const value of ensureArray(option)) {
            if (value instanceof RegExp) {
                matchers.push(value);
            }
            else {
                ids.add(value);
            }
        }
        return (id, ..._arguments) => ids.has(id) || matchers.some(matcher => matcher.test(id));
    }
    return () => false;
};
const getInlineDynamicImports$1 = (config, log, strictDeprecations) => {
    const configInlineDynamicImports = config.inlineDynamicImports;
    if (configInlineDynamicImports) {
        warnDeprecationWithOptions('The "inlineDynamicImports" option is deprecated. Use the "output.inlineDynamicImports" option instead.', URL_OUTPUT_INLINEDYNAMICIMPORTS, true, log, strictDeprecations);
    }
    return configInlineDynamicImports;
};
const getInput = (config) => {
    const configInput = config.input;
    return configInput == null ? [] : typeof configInput === 'string' ? [configInput] : configInput;
};
const getManualChunks$1 = (config, log, strictDeprecations) => {
    const configManualChunks = config.manualChunks;
    if (configManualChunks) {
        warnDeprecationWithOptions('The "manualChunks" option is deprecated. Use the "output.manualChunks" option instead.', URL_OUTPUT_MANUALCHUNKS, true, log, strictDeprecations);
    }
    return configManualChunks;
};
const getMaxParallelFileOps = (config, log, strictDeprecations) => {
    const maxParallelFileReads = config.maxParallelFileReads;
    if (typeof maxParallelFileReads === 'number') {
        warnDeprecationWithOptions('The "maxParallelFileReads" option is deprecated. Use the "maxParallelFileOps" option instead.', URL_MAXPARALLELFILEOPS, true, log, strictDeprecations);
    }
    const maxParallelFileOps = config.maxParallelFileOps ?? maxParallelFileReads;
    if (typeof maxParallelFileOps === 'number') {
        if (maxParallelFileOps <= 0)
            return Infinity;
        return maxParallelFileOps;
    }
    return 20;
};
const getModuleContext = (config, context) => {
    const configModuleContext = config.moduleContext;
    if (typeof configModuleContext === 'function') {
        return id => configModuleContext(id) ?? context;
    }
    if (configModuleContext) {
        const contextByModuleId = Object.create(null);
        for (const [key, moduleContext] of Object.entries(configModuleContext)) {
            contextByModuleId[resolve(key)] = moduleContext;
        }
        return id => contextByModuleId[id] ?? context;
    }
    return () => context;
};
const getPreserveModules$1 = (config, log, strictDeprecations) => {
    const configPreserveModules = config.preserveModules;
    if (configPreserveModules) {
        warnDeprecationWithOptions('The "preserveModules" option is deprecated. Use the "output.preserveModules" option instead.', URL_OUTPUT_PRESERVEMODULES, true, log, strictDeprecations);
    }
    return configPreserveModules;
};
const getTreeshake = (config) => {
    const configTreeshake = config.treeshake;
    if (configTreeshake === false) {
        return false;
    }
    const configWithPreset = getOptionWithPreset(config.treeshake, treeshakePresets, 'treeshake', URL_TREESHAKE, 'false, true, ');
    return {
        annotations: configWithPreset.annotations !== false,
        correctVarValueBeforeDeclaration: configWithPreset.correctVarValueBeforeDeclaration === true,
        manualPureFunctions: configWithPreset.manualPureFunctions ?? EMPTY_ARRAY,
        moduleSideEffects: getHasModuleSideEffects(configWithPreset.moduleSideEffects),
        propertyReadSideEffects: configWithPreset.propertyReadSideEffects === 'always'
            ? 'always'
            : configWithPreset.propertyReadSideEffects !== false,
        tryCatchDeoptimization: configWithPreset.tryCatchDeoptimization !== false,
        unknownGlobalSideEffects: configWithPreset.unknownGlobalSideEffects !== false
    };
};
const getHasModuleSideEffects = (moduleSideEffectsOption) => {
    if (typeof moduleSideEffectsOption === 'boolean') {
        return () => moduleSideEffectsOption;
    }
    if (moduleSideEffectsOption === 'no-external') {
        return (_id, external) => !external;
    }
    if (typeof moduleSideEffectsOption === 'function') {
        return (id, external) => id.startsWith('\0') ? true : moduleSideEffectsOption(id, external) !== false;
    }
    if (Array.isArray(moduleSideEffectsOption)) {
        const ids = new Set(moduleSideEffectsOption);
        return id => ids.has(id);
    }
    if (moduleSideEffectsOption) {
        error(logInvalidOption('treeshake.moduleSideEffects', URL_TREESHAKE_MODULESIDEEFFECTS, 'please use one of false, "no-external", a function or an array'));
    }
    return () => true;
};

// https://datatracker.ietf.org/doc/html/rfc2396
// eslint-disable-next-line no-control-regex
const INVALID_CHAR_REGEX = /[\u0000-\u001F"#$&*+,:;<=>?[\]^`{|}\u007F]/g;
const DRIVE_LETTER_REGEX = /^[a-z]:/i;
function sanitizeFileName(name) {
    const match = DRIVE_LETTER_REGEX.exec(name);
    const driveLetter = match ? match[0] : '';
    // A `:` is only allowed as part of a windows drive letter (ex: C:\foo)
    // Otherwise, avoid them because they can refer to NTFS alternate data streams.
    return driveLetter + name.slice(driveLetter.length).replace(INVALID_CHAR_REGEX, '_');
}

async function normalizeOutputOptions(config, inputOptions, unsetInputOptions) {
    // These are options that may trigger special warnings or behaviour later
    // if the user did not select an explicit value
    const unsetOptions = new Set(unsetInputOptions);
    const compact = config.compact || false;
    const format = getFormat(config);
    const inlineDynamicImports = getInlineDynamicImports(config, inputOptions);
    const preserveModules = getPreserveModules(config, inlineDynamicImports, inputOptions);
    const file = getFile(config, preserveModules, inputOptions);
    const preferConst = getPreferConst(config, inputOptions);
    const generatedCode = getGeneratedCode(config, preferConst);
    const outputOptions = {
        amd: getAmd(config),
        assetFileNames: config.assetFileNames ?? 'assets/[name]-[hash][extname]',
        banner: getAddon(config, 'banner'),
        chunkFileNames: config.chunkFileNames ?? '[name]-[hash].js',
        compact,
        dir: getDir(config, file),
        dynamicImportFunction: getDynamicImportFunction(config, inputOptions, format),
        dynamicImportInCjs: config.dynamicImportInCjs ?? true,
        entryFileNames: getEntryFileNames(config, unsetOptions),
        esModule: config.esModule ?? 'if-default-prop',
        experimentalDeepDynamicChunkOptimization: getExperimentalDeepDynamicChunkOptimization(config, inputOptions),
        experimentalMinChunkSize: config.experimentalMinChunkSize ?? 1,
        exports: getExports(config, unsetOptions),
        extend: config.extend || false,
        externalImportAssertions: config.externalImportAssertions ?? true,
        externalLiveBindings: config.externalLiveBindings ?? true,
        file,
        footer: getAddon(config, 'footer'),
        format,
        freeze: config.freeze ?? true,
        generatedCode,
        globals: config.globals || {},
        hoistTransitiveImports: config.hoistTransitiveImports ?? true,
        indent: getIndent(config, compact),
        inlineDynamicImports,
        interop: getInterop(config),
        intro: getAddon(config, 'intro'),
        manualChunks: getManualChunks(config, inlineDynamicImports, preserveModules, inputOptions),
        minifyInternalExports: getMinifyInternalExports(config, format, compact),
        name: config.name,
        namespaceToStringTag: getNamespaceToStringTag(config, generatedCode, inputOptions),
        noConflict: config.noConflict || false,
        outro: getAddon(config, 'outro'),
        paths: config.paths || {},
        plugins: await normalizePluginOption(config.plugins),
        preferConst,
        preserveModules,
        preserveModulesRoot: getPreserveModulesRoot(config),
        sanitizeFileName: typeof config.sanitizeFileName === 'function'
            ? config.sanitizeFileName
            : config.sanitizeFileName === false
                ? id => id
                : sanitizeFileName,
        sourcemap: config.sourcemap || false,
        sourcemapBaseUrl: getSourcemapBaseUrl(config),
        sourcemapExcludeSources: config.sourcemapExcludeSources || false,
        sourcemapFile: config.sourcemapFile,
        sourcemapFileNames: getSourcemapFileNames(config, unsetOptions),
        sourcemapIgnoreList: typeof config.sourcemapIgnoreList === 'function'
            ? config.sourcemapIgnoreList
            : config.sourcemapIgnoreList === false
                ? () => false
                : relativeSourcePath => relativeSourcePath.includes('node_modules'),
        sourcemapPathTransform: config.sourcemapPathTransform,
        strict: config.strict ?? true,
        systemNullSetters: config.systemNullSetters ?? true,
        validate: config.validate || false
    };
    warnUnknownOptions(config, Object.keys(outputOptions), 'output options', inputOptions.onLog);
    return { options: outputOptions, unsetOptions };
}
const getFile = (config, preserveModules, inputOptions) => {
    const { file } = config;
    if (typeof file === 'string') {
        if (preserveModules) {
            return error(logInvalidOption('output.file', URL_OUTPUT_DIR, 'you must set "output.dir" instead of "output.file" when using the "output.preserveModules" option'));
        }
        if (!Array.isArray(inputOptions.input))
            return error(logInvalidOption('output.file', URL_OUTPUT_DIR, 'you must set "output.dir" instead of "output.file" when providing named inputs'));
    }
    return file;
};
const getFormat = (config) => {
    const configFormat = config.format;
    switch (configFormat) {
        case undefined:
        case 'es':
        case 'esm':
        case 'module': {
            return 'es';
        }
        case 'cjs':
        case 'commonjs': {
            return 'cjs';
        }
        case 'system':
        case 'systemjs': {
            return 'system';
        }
        case 'amd':
        case 'iife':
        case 'umd': {
            return configFormat;
        }
        default: {
            return error(logInvalidOption('output.format', URL_OUTPUT_FORMAT, `Valid values are "amd", "cjs", "system", "es", "iife" or "umd"`, configFormat));
        }
    }
};
const getInlineDynamicImports = (config, inputOptions) => {
    const inlineDynamicImports = (config.inlineDynamicImports ?? inputOptions.inlineDynamicImports) || false;
    const { input } = inputOptions;
    if (inlineDynamicImports && (Array.isArray(input) ? input : Object.keys(input)).length > 1) {
        return error(logInvalidOption('output.inlineDynamicImports', URL_OUTPUT_INLINEDYNAMICIMPORTS, 'multiple inputs are not supported when "output.inlineDynamicImports" is true'));
    }
    return inlineDynamicImports;
};
const getPreserveModules = (config, inlineDynamicImports, inputOptions) => {
    const preserveModules = (config.preserveModules ?? inputOptions.preserveModules) || false;
    if (preserveModules) {
        if (inlineDynamicImports) {
            return error(logInvalidOption('output.inlineDynamicImports', URL_OUTPUT_INLINEDYNAMICIMPORTS, `this option is not supported for "output.preserveModules"`));
        }
        if (inputOptions.preserveEntrySignatures === false) {
            return error(logInvalidOption('preserveEntrySignatures', URL_PRESERVEENTRYSIGNATURES, 'setting this option to false is not supported for "output.preserveModules"'));
        }
    }
    return preserveModules;
};
const getPreferConst = (config, inputOptions) => {
    const configPreferConst = config.preferConst;
    if (configPreferConst != null) {
        warnDeprecation(`The "output.preferConst" option is deprecated. Use the "output.generatedCode.constBindings" option instead.`, URL_OUTPUT_GENERATEDCODE_CONSTBINDINGS, true, inputOptions);
    }
    return !!configPreferConst;
};
const getPreserveModulesRoot = (config) => {
    const { preserveModulesRoot } = config;
    if (preserveModulesRoot === null || preserveModulesRoot === undefined) {
        return undefined;
    }
    return resolve(preserveModulesRoot);
};
const getAmd = (config) => {
    const mergedOption = {
        autoId: false,
        basePath: '',
        define: 'define',
        forceJsExtensionForImports: false,
        ...config.amd
    };
    if ((mergedOption.autoId || mergedOption.basePath) && mergedOption.id) {
        return error(logInvalidOption('output.amd.id', URL_OUTPUT_AMD_ID, 'this option cannot be used together with "output.amd.autoId"/"output.amd.basePath"'));
    }
    if (mergedOption.basePath && !mergedOption.autoId) {
        return error(logInvalidOption('output.amd.basePath', URL_OUTPUT_AMD_BASEPATH, 'this option only works with "output.amd.autoId"'));
    }
    return mergedOption.autoId
        ? {
            autoId: true,
            basePath: mergedOption.basePath,
            define: mergedOption.define,
            forceJsExtensionForImports: mergedOption.forceJsExtensionForImports
        }
        : {
            autoId: false,
            define: mergedOption.define,
            forceJsExtensionForImports: mergedOption.forceJsExtensionForImports,
            id: mergedOption.id
        };
};
const getAddon = (config, name) => {
    const configAddon = config[name];
    if (typeof configAddon === 'function') {
        return configAddon;
    }
    return () => configAddon || '';
};
// eslint-disable-next-line unicorn/prevent-abbreviations
const getDir = (config, file) => {
    const { dir } = config;
    if (typeof dir === 'string' && typeof file === 'string') {
        return error(logInvalidOption('output.dir', URL_OUTPUT_DIR, 'you must set either "output.file" for a single-file build or "output.dir" when generating multiple chunks'));
    }
    return dir;
};
const getDynamicImportFunction = (config, inputOptions, format) => {
    const configDynamicImportFunction = config.dynamicImportFunction;
    if (configDynamicImportFunction) {
        warnDeprecation(`The "output.dynamicImportFunction" option is deprecated. Use the "renderDynamicImport" plugin hook instead.`, URL_RENDERDYNAMICIMPORT, true, inputOptions);
        if (format !== 'es') {
            inputOptions.onLog(LOGLEVEL_WARN, logInvalidOption('output.dynamicImportFunction', URL_OUTPUT_DYNAMICIMPORTFUNCTION, 'this option is ignored for formats other than "es"'));
        }
    }
    return configDynamicImportFunction;
};
const getEntryFileNames = (config, unsetOptions) => {
    const configEntryFileNames = config.entryFileNames;
    if (configEntryFileNames == null) {
        unsetOptions.add('entryFileNames');
    }
    return configEntryFileNames ?? '[name].js';
};
function getExperimentalDeepDynamicChunkOptimization(config, inputOptions) {
    const configExperimentalDeepDynamicChunkOptimization = config.experimentalDeepDynamicChunkOptimization;
    if (configExperimentalDeepDynamicChunkOptimization != null) {
        warnDeprecation(`The "output.experimentalDeepDynamicChunkOptimization" option is deprecated as Rollup always runs the full chunking algorithm now. The option should be removed.`, URL_OUTPUT_EXPERIMENTALDEEPCHUNKOPTIMIZATION, true, inputOptions);
    }
    return configExperimentalDeepDynamicChunkOptimization || false;
}
function getExports(config, unsetOptions) {
    const configExports = config.exports;
    if (configExports == null) {
        unsetOptions.add('exports');
    }
    else if (!['default', 'named', 'none', 'auto'].includes(configExports)) {
        return error(logInvalidExportOptionValue(configExports));
    }
    return configExports || 'auto';
}
const getGeneratedCode = (config, preferConst) => {
    const configWithPreset = getOptionWithPreset(config.generatedCode, generatedCodePresets, 'output.generatedCode', URL_OUTPUT_GENERATEDCODE, '');
    return {
        arrowFunctions: configWithPreset.arrowFunctions === true,
        constBindings: configWithPreset.constBindings === true || preferConst,
        objectShorthand: configWithPreset.objectShorthand === true,
        reservedNamesAsProps: configWithPreset.reservedNamesAsProps !== false,
        symbols: configWithPreset.symbols === true
    };
};
const getIndent = (config, compact) => {
    if (compact) {
        return '';
    }
    const configIndent = config.indent;
    return configIndent === false ? '' : configIndent ?? true;
};
const ALLOWED_INTEROP_TYPES = new Set([
    'compat',
    'auto',
    'esModule',
    'default',
    'defaultOnly'
]);
const getInterop = (config) => {
    const configInterop = config.interop;
    if (typeof configInterop === 'function') {
        const interopPerId = Object.create(null);
        let defaultInterop = null;
        return id => id === null
            ? defaultInterop || validateInterop((defaultInterop = configInterop(id)))
            : id in interopPerId
                ? interopPerId[id]
                : validateInterop((interopPerId[id] = configInterop(id)));
    }
    return configInterop === undefined ? () => 'default' : () => validateInterop(configInterop);
};
const validateInterop = (interop) => {
    if (!ALLOWED_INTEROP_TYPES.has(interop)) {
        return error(logInvalidOption('output.interop', URL_OUTPUT_INTEROP, 
        // eslint-disable-next-line unicorn/prefer-spread
        `use one of ${Array.from(ALLOWED_INTEROP_TYPES, value => JSON.stringify(value)).join(', ')}`, interop));
    }
    return interop;
};
const getManualChunks = (config, inlineDynamicImports, preserveModules, inputOptions) => {
    const configManualChunks = config.manualChunks || inputOptions.manualChunks;
    if (configManualChunks) {
        if (inlineDynamicImports) {
            return error(logInvalidOption('output.manualChunks', URL_OUTPUT_MANUALCHUNKS, 'this option is not supported for "output.inlineDynamicImports"'));
        }
        if (preserveModules) {
            return error(logInvalidOption('output.manualChunks', URL_OUTPUT_MANUALCHUNKS, 'this option is not supported for "output.preserveModules"'));
        }
    }
    return configManualChunks || {};
};
const getMinifyInternalExports = (config, format, compact) => config.minifyInternalExports ?? (compact || format === 'es' || format === 'system');
const getNamespaceToStringTag = (config, generatedCode, inputOptions) => {
    const configNamespaceToStringTag = config.namespaceToStringTag;
    if (configNamespaceToStringTag != null) {
        warnDeprecation(`The "output.namespaceToStringTag" option is deprecated. Use the "output.generatedCode.symbols" option instead.`, URL_OUTPUT_GENERATEDCODE_SYMBOLS, true, inputOptions);
        return configNamespaceToStringTag;
    }
    return generatedCode.symbols || false;
};
const getSourcemapFileNames = (config, unsetOptions) => {
    const configSourcemapFileNames = config.sourcemapFileNames;
    if (configSourcemapFileNames == null) {
        unsetOptions.add('sourcemapFileNames');
    }
    return configSourcemapFileNames;
};
const getSourcemapBaseUrl = (config) => {
    const { sourcemapBaseUrl } = config;
    if (sourcemapBaseUrl) {
        if (isValidUrl(sourcemapBaseUrl)) {
            return addTrailingSlashIfMissed(sourcemapBaseUrl);
        }
        return error(logInvalidOption('output.sourcemapBaseUrl', URL_OUTPUT_SOURCEMAPBASEURL, `must be a valid URL, received ${JSON.stringify(sourcemapBaseUrl)}`));
    }
};

function rollup(rawInputOptions) {
    return rollupInternal(rawInputOptions, null);
}
async function rollupInternal(rawInputOptions, watcher) {
    const { options: inputOptions, unsetOptions: unsetInputOptions } = await getInputOptions(rawInputOptions, watcher !== null);
    initialiseTimers(inputOptions);
    const graph = new Graph(inputOptions, watcher);
    // remove the cache object from the memory after graph creation (cache is not used anymore)
    const useCache = rawInputOptions.cache !== false;
    if (rawInputOptions.cache) {
        inputOptions.cache = undefined;
        rawInputOptions.cache = undefined;
    }
    timeStart('BUILD', 1);
    await catchUnfinishedHookActions(graph.pluginDriver, async () => {
        try {
            timeStart('initialize', 2);
            await graph.pluginDriver.hookParallel('buildStart', [inputOptions]);
            timeEnd('initialize', 2);
            await graph.build();
        }
        catch (error_) {
            const watchFiles = Object.keys(graph.watchFiles);
            if (watchFiles.length > 0) {
                error_.watchFiles = watchFiles;
            }
            await graph.pluginDriver.hookParallel('buildEnd', [error_]);
            await graph.pluginDriver.hookParallel('closeBundle', []);
            throw error_;
        }
        await graph.pluginDriver.hookParallel('buildEnd', []);
    });
    timeEnd('BUILD', 1);
    const result = {
        cache: useCache ? graph.getCache() : undefined,
        async close() {
            if (result.closed)
                return;
            result.closed = true;
            await graph.pluginDriver.hookParallel('closeBundle', []);
        },
        closed: false,
        async generate(rawOutputOptions) {
            if (result.closed)
                return error(logAlreadyClosed());
            return handleGenerateWrite(false, inputOptions, unsetInputOptions, rawOutputOptions, graph);
        },
        watchFiles: Object.keys(graph.watchFiles),
        async write(rawOutputOptions) {
            if (result.closed)
                return error(logAlreadyClosed());
            return handleGenerateWrite(true, inputOptions, unsetInputOptions, rawOutputOptions, graph);
        }
    };
    if (inputOptions.perf)
        result.getTimings = getTimings;
    return result;
}
async function getInputOptions(initialInputOptions, watchMode) {
    if (!initialInputOptions) {
        throw new Error('You must supply an options object to rollup');
    }
    const processedInputOptions = await getProcessedInputOptions(initialInputOptions, watchMode);
    const { options, unsetOptions } = await normalizeInputOptions(processedInputOptions, watchMode);
    normalizePlugins(options.plugins, ANONYMOUS_PLUGIN_PREFIX);
    return { options, unsetOptions };
}
async function getProcessedInputOptions(inputOptions, watchMode) {
    const plugins = getSortedValidatedPlugins('options', await normalizePluginOption(inputOptions.plugins));
    const logLevel = inputOptions.logLevel || LOGLEVEL_INFO;
    const logger = getLogger(plugins, getOnLog(inputOptions, logLevel), watchMode, logLevel);
    for (const plugin of plugins) {
        const { name, options } = plugin;
        const handler = 'handler' in options ? options.handler : options;
        const processedOptions = await handler.call({
            debug: getLogHandler(LOGLEVEL_DEBUG, 'PLUGIN_LOG', logger, name, logLevel),
            error: (error_) => error(logPluginError(normalizeLog(error_), name, { hook: 'onLog' })),
            info: getLogHandler(LOGLEVEL_INFO, 'PLUGIN_LOG', logger, name, logLevel),
            meta: { rollupVersion: version$1, watchMode },
            warn: getLogHandler(LOGLEVEL_WARN, 'PLUGIN_WARNING', logger, name, logLevel)
        }, inputOptions);
        if (processedOptions) {
            inputOptions = processedOptions;
        }
    }
    return inputOptions;
}
function normalizePlugins(plugins, anonymousPrefix) {
    for (const [index, plugin] of plugins.entries()) {
        if (!plugin.name) {
            plugin.name = `${anonymousPrefix}${index + 1}`;
        }
    }
}
async function handleGenerateWrite(isWrite, inputOptions, unsetInputOptions, rawOutputOptions, graph) {
    const { options: outputOptions, outputPluginDriver, unsetOptions } = await getOutputOptionsAndPluginDriver(rawOutputOptions, graph.pluginDriver, inputOptions, unsetInputOptions);
    return catchUnfinishedHookActions(outputPluginDriver, async () => {
        const bundle = new Bundle(outputOptions, unsetOptions, inputOptions, outputPluginDriver, graph);
        const generated = await bundle.generate(isWrite);
        if (isWrite) {
            timeStart('WRITE', 1);
            if (!outputOptions.dir && !outputOptions.file) {
                return error(logMissingFileOrDirOption());
            }
            await Promise.all(Object.values(generated).map(chunk => graph.fileOperationQueue.run(() => writeOutputFile(chunk, outputOptions))));
            await outputPluginDriver.hookParallel('writeBundle', [outputOptions, generated]);
            timeEnd('WRITE', 1);
        }
        return createOutput(generated);
    });
}
async function getOutputOptionsAndPluginDriver(rawOutputOptions, inputPluginDriver, inputOptions, unsetInputOptions) {
    if (!rawOutputOptions) {
        throw new Error('You must supply an options object');
    }
    const rawPlugins = await normalizePluginOption(rawOutputOptions.plugins);
    normalizePlugins(rawPlugins, ANONYMOUS_OUTPUT_PLUGIN_PREFIX);
    const outputPluginDriver = inputPluginDriver.createOutputPluginDriver(rawPlugins);
    return {
        ...(await getOutputOptions(inputOptions, unsetInputOptions, rawOutputOptions, outputPluginDriver)),
        outputPluginDriver
    };
}
function getOutputOptions(inputOptions, unsetInputOptions, rawOutputOptions, outputPluginDriver) {
    return normalizeOutputOptions(outputPluginDriver.hookReduceArg0Sync('outputOptions', [rawOutputOptions], (outputOptions, result) => result || outputOptions, pluginContext => {
        const emitError = () => pluginContext.error(logCannotEmitFromOptionsHook());
        return {
            ...pluginContext,
            emitFile: emitError,
            setAssetSource: emitError
        };
    }), inputOptions, unsetInputOptions);
}
function createOutput(outputBundle) {
    return {
        output: Object.values(outputBundle).filter(outputFile => Object.keys(outputFile).length > 0).sort((outputFileA, outputFileB) => getSortingFileType(outputFileA) - getSortingFileType(outputFileB))
    };
}
var SortingFileType;
(function (SortingFileType) {
    SortingFileType[SortingFileType["ENTRY_CHUNK"] = 0] = "ENTRY_CHUNK";
    SortingFileType[SortingFileType["SECONDARY_CHUNK"] = 1] = "SECONDARY_CHUNK";
    SortingFileType[SortingFileType["ASSET"] = 2] = "ASSET";
})(SortingFileType || (SortingFileType = {}));
function getSortingFileType(file) {
    if (file.type === 'asset') {
        return SortingFileType.ASSET;
    }
    if (file.isEntry) {
        return SortingFileType.ENTRY_CHUNK;
    }
    return SortingFileType.SECONDARY_CHUNK;
}
async function writeOutputFile(outputFile, outputOptions) {
    const fileName = resolve(outputOptions.dir || dirname(outputOptions.file), outputFile.fileName);
    // 'recursive: true' does not throw if the folder structure, or parts of it, already exist
    await mkdir(dirname(fileName), { recursive: true });
    return writeFile(fileName, outputFile.type === 'asset' ? outputFile.source : outputFile.code);
}
/**
 * Auxiliary function for defining rollup configuration
 * Mainly to facilitate IDE code prompts, after all, export default does not
 * prompt, even if you add @type annotations, it is not accurate
 * @param options
 */
function defineConfig(options) {
    return options;
}

const {
  env = {},
  argv = [],
  platform = "",
} = typeof process === "undefined" ? {} : process;

const isDisabled = "NO_COLOR" in env || argv.includes("--no-color");
const isForced = "FORCE_COLOR" in env || argv.includes("--color");
const isWindows = platform === "win32";
const isDumbTerminal = env.TERM === "dumb";

const isCompatibleTerminal =
  tty && tty.isatty && tty.isatty(1) && env.TERM && !isDumbTerminal;

const isCI =
  "CI" in env &&
  ("GITHUB_ACTIONS" in env || "GITLAB_CI" in env || "CIRCLECI" in env);

const isColorSupported =
  !isDisabled &&
  (isForced || (isWindows && !isDumbTerminal) || isCompatibleTerminal || isCI);

const replaceClose = (
  index,
  string,
  close,
  replace,
  head = string.substring(0, index) + replace,
  tail = string.substring(index + close.length),
  next = tail.indexOf(close)
) => head + (next < 0 ? tail : replaceClose(next, tail, close, replace));

const clearBleed = (index, string, open, close, replace) =>
  index < 0
    ? open + string + close
    : open + replaceClose(index, string, close, replace) + close;

const filterEmpty =
  (open, close, replace = open, at = open.length + 1) =>
  (string) =>
    string || !(string === "" || string === undefined)
      ? clearBleed(
          ("" + string).indexOf(close, at),
          string,
          open,
          close,
          replace
        )
      : "";

const init = (open, close, replace) =>
  filterEmpty(`\x1b[${open}m`, `\x1b[${close}m`, replace);

const colors = {
  reset: init(0, 0),
  bold: init(1, 22, "\x1b[22m\x1b[1m"),
  dim: init(2, 22, "\x1b[22m\x1b[2m"),
  italic: init(3, 23),
  underline: init(4, 24),
  inverse: init(7, 27),
  hidden: init(8, 28),
  strikethrough: init(9, 29),
  black: init(30, 39),
  red: init(31, 39),
  green: init(32, 39),
  yellow: init(33, 39),
  blue: init(34, 39),
  magenta: init(35, 39),
  cyan: init(36, 39),
  white: init(37, 39),
  gray: init(90, 39),
  bgBlack: init(40, 49),
  bgRed: init(41, 49),
  bgGreen: init(42, 49),
  bgYellow: init(43, 49),
  bgBlue: init(44, 49),
  bgMagenta: init(45, 49),
  bgCyan: init(46, 49),
  bgWhite: init(47, 49),
  blackBright: init(90, 39),
  redBright: init(91, 39),
  greenBright: init(92, 39),
  yellowBright: init(93, 39),
  blueBright: init(94, 39),
  magentaBright: init(95, 39),
  cyanBright: init(96, 39),
  whiteBright: init(97, 39),
  bgBlackBright: init(100, 49),
  bgRedBright: init(101, 49),
  bgGreenBright: init(102, 49),
  bgYellowBright: init(103, 49),
  bgBlueBright: init(104, 49),
  bgMagentaBright: init(105, 49),
  bgCyanBright: init(106, 49),
  bgWhiteBright: init(107, 49),
};

const createColors = ({ useColor = isColorSupported } = {}) =>
  useColor
    ? colors
    : Object.keys(colors).reduce(
        (colors, key) => ({ ...colors, [key]: String }),
        {}
      );

createColors();

// @see https://no-color.org
// @see https://www.npmjs.com/package/chalk
const { bold, cyan, dim, gray, green, red, underline, yellow } = createColors({
    useColor: env$1.FORCE_COLOR !== '0' && !env$1.NO_COLOR
});

// log to stderr to keep `rollup main.js > bundle.js` from breaking
const stderr = (...parameters) => process$1.stderr.write(`${parameters.join('')}\n`);
function handleError(error, recover = false) {
    const name = error.name || error.cause?.name;
    const nameSection = name ? `${name}: ` : '';
    const pluginSection = error.plugin ? `(plugin ${error.plugin}) ` : '';
    const message = `${pluginSection}${nameSection}${error.message}`;
    const outputLines = [bold(red(`[!] ${bold(message.toString())}`))];
    if (error.url) {
        outputLines.push(cyan(error.url));
    }
    if (error.loc) {
        outputLines.push(`${relativeId((error.loc.file || error.id))} (${error.loc.line}:${error.loc.column})`);
    }
    else if (error.id) {
        outputLines.push(relativeId(error.id));
    }
    if (error.frame) {
        outputLines.push(dim(error.frame));
    }
    if (error.stack) {
        outputLines.push(dim(error.stack?.replace(`${nameSection}${error.message}\n`, '')));
    }
    outputLines.push('', '');
    stderr(outputLines.join('\n'));
    if (!recover)
        process$1.exit(1);
}

const commandAliases = {
    c: 'config',
    d: 'dir',
    e: 'external',
    f: 'format',
    g: 'globals',
    h: 'help',
    i: 'input',
    m: 'sourcemap',
    n: 'name',
    o: 'file',
    p: 'plugin',
    v: 'version',
    w: 'watch'
};
const EMPTY_COMMAND_OPTIONS = { external: [], globals: undefined };
async function mergeOptions(config, watchMode, rawCommandOptions = EMPTY_COMMAND_OPTIONS, printLog) {
    const command = getCommandOptions(rawCommandOptions);
    const plugins = await normalizePluginOption(config.plugins);
    const logLevel = config.logLevel || LOGLEVEL_INFO;
    const onLog = getOnLog(config, logLevel, printLog);
    const log = getLogger(plugins, onLog, watchMode, logLevel);
    const inputOptions = await mergeInputOptions(config, command, plugins, log, onLog);
    if (command.output) {
        Object.assign(command, command.output);
    }
    const outputOptionsArray = ensureArray(config.output);
    if (outputOptionsArray.length === 0)
        outputOptionsArray.push({});
    const outputOptions = await Promise.all(outputOptionsArray.map(singleOutputOptions => mergeOutputOptions(singleOutputOptions, command, log)));
    warnUnknownOptions(command, [
        ...Object.keys(inputOptions),
        ...Object.keys(outputOptions[0]).filter(option => option !== 'sourcemapIgnoreList' && option !== 'sourcemapPathTransform'),
        ...Object.keys(commandAliases),
        'bundleConfigAsCjs',
        'config',
        'environment',
        'filterLogs',
        'plugin',
        'silent',
        'failAfterWarnings',
        'stdin',
        'waitForBundleInput',
        'configPlugin'
    ], 'CLI flags', log, /^_$|output$|config/);
    inputOptions.output = outputOptions;
    return inputOptions;
}
function getCommandOptions(rawCommandOptions) {
    const external = rawCommandOptions.external && typeof rawCommandOptions.external === 'string'
        ? rawCommandOptions.external.split(',')
        : [];
    return {
        ...rawCommandOptions,
        external,
        globals: typeof rawCommandOptions.globals === 'string'
            ? rawCommandOptions.globals.split(',').reduce((globals, globalDefinition) => {
                const [id, variableName] = globalDefinition.split(':');
                globals[id] = variableName;
                if (!external.includes(id)) {
                    external.push(id);
                }
                return globals;
            }, Object.create(null))
            : undefined
    };
}
function mergeInputOptions(config, overrides, plugins, log, onLog) {
    const getOption = (name) => overrides[name] ?? config[name];
    const inputOptions = {
        acorn: getOption('acorn'),
        acornInjectPlugins: config.acornInjectPlugins,
        cache: config.cache,
        context: getOption('context'),
        experimentalCacheExpiry: getOption('experimentalCacheExpiry'),
        experimentalLogSideEffects: getOption('experimentalLogSideEffects'),
        external: getExternal(config, overrides),
        inlineDynamicImports: getOption('inlineDynamicImports'),
        input: getOption('input') || [],
        logLevel: getOption('logLevel'),
        makeAbsoluteExternalsRelative: getOption('makeAbsoluteExternalsRelative'),
        manualChunks: getOption('manualChunks'),
        maxParallelFileOps: getOption('maxParallelFileOps'),
        maxParallelFileReads: getOption('maxParallelFileReads'),
        moduleContext: getOption('moduleContext'),
        onLog,
        onwarn: undefined,
        perf: getOption('perf'),
        plugins,
        preserveEntrySignatures: getOption('preserveEntrySignatures'),
        preserveModules: getOption('preserveModules'),
        preserveSymlinks: getOption('preserveSymlinks'),
        shimMissingExports: getOption('shimMissingExports'),
        strictDeprecations: getOption('strictDeprecations'),
        treeshake: getObjectOption(config, overrides, 'treeshake', objectifyOptionWithPresets(treeshakePresets, 'treeshake', URL_TREESHAKE, 'false, true, ')),
        watch: getWatch(config, overrides)
    };
    warnUnknownOptions(config, Object.keys(inputOptions), 'input options', log, /^output$/);
    return inputOptions;
}
const getExternal = (config, overrides) => {
    const configExternal = config.external;
    return typeof configExternal === 'function'
        ? (source, importer, isResolved) => configExternal(source, importer, isResolved) || overrides.external.includes(source)
        : [...ensureArray(configExternal), ...overrides.external];
};
const getObjectOption = (config, overrides, name, objectifyValue = objectifyOption) => {
    const commandOption = normalizeObjectOptionValue(overrides[name], objectifyValue);
    const configOption = normalizeObjectOptionValue(config[name], objectifyValue);
    if (commandOption !== undefined) {
        return commandOption && { ...configOption, ...commandOption };
    }
    return configOption;
};
const getWatch = (config, overrides) => config.watch !== false && getObjectOption(config, overrides, 'watch');
const normalizeObjectOptionValue = (optionValue, objectifyValue) => {
    if (!optionValue) {
        return optionValue;
    }
    if (Array.isArray(optionValue)) {
        return optionValue.reduce((result, value) => value && result && { ...result, ...objectifyValue(value) }, {});
    }
    return objectifyValue(optionValue);
};
async function mergeOutputOptions(config, overrides, log) {
    const getOption = (name) => overrides[name] ?? config[name];
    const outputOptions = {
        amd: getObjectOption(config, overrides, 'amd'),
        assetFileNames: getOption('assetFileNames'),
        banner: getOption('banner'),
        chunkFileNames: getOption('chunkFileNames'),
        compact: getOption('compact'),
        dir: getOption('dir'),
        dynamicImportFunction: getOption('dynamicImportFunction'),
        dynamicImportInCjs: getOption('dynamicImportInCjs'),
        entryFileNames: getOption('entryFileNames'),
        esModule: getOption('esModule'),
        experimentalDeepDynamicChunkOptimization: getOption('experimentalDeepDynamicChunkOptimization'),
        experimentalMinChunkSize: getOption('experimentalMinChunkSize'),
        exports: getOption('exports'),
        extend: getOption('extend'),
        externalImportAssertions: getOption('externalImportAssertions'),
        externalLiveBindings: getOption('externalLiveBindings'),
        file: getOption('file'),
        footer: getOption('footer'),
        format: getOption('format'),
        freeze: getOption('freeze'),
        generatedCode: getObjectOption(config, overrides, 'generatedCode', objectifyOptionWithPresets(generatedCodePresets, 'output.generatedCode', URL_OUTPUT_GENERATEDCODE, '')),
        globals: getOption('globals'),
        hoistTransitiveImports: getOption('hoistTransitiveImports'),
        indent: getOption('indent'),
        inlineDynamicImports: getOption('inlineDynamicImports'),
        interop: getOption('interop'),
        intro: getOption('intro'),
        manualChunks: getOption('manualChunks'),
        minifyInternalExports: getOption('minifyInternalExports'),
        name: getOption('name'),
        namespaceToStringTag: getOption('namespaceToStringTag'),
        noConflict: getOption('noConflict'),
        outro: getOption('outro'),
        paths: getOption('paths'),
        plugins: await normalizePluginOption(config.plugins),
        pr