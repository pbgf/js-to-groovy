const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

class JSToGroovyTranspiler {
  constructor() {
    this.supportedNodeTypes = new Set([
      'Program',
      'ClassDeclaration',
      'ClassBody',
      'MethodDefinition',
      'ClassMethod',
      'FunctionDeclaration',
      'ReturnStatement',
      'ObjectExpression',
      'Property',
      'ObjectProperty',
      'ArrayExpression',
      'ConditionalExpression',
      'LogicalExpression',
      'BinaryExpression',
      'MemberExpression',
      'Identifier',
      'Literal',
      'StringLiteral',
      'NumericLiteral',
      'BooleanLiteral',
      'NullLiteral',
      'BlockStatement',
      'ExpressionStatement',
      'VariableDeclaration',
      'VariableDeclarator',
      'AssignmentExpression',
      'CallExpression',
      'OptionalMemberExpression',
      'OptionalCallExpression',
      'NewExpression',
      'ExportNamedDeclaration',
      'ExportDefaultDeclaration',
      'TemplateLiteral',
      'TemplateElement',
      'TryStatement',
      'CatchClause',
      'IfStatement',
      'ObjectPattern',
      'ArrayPattern',
      'ArrowFunctionExpression',
      'UnaryExpression',
    ]);

    this.output = '';
    this.indentLevel = 0;
  }

  transpile(jsCode) {
    try {
      const ast = parse(jsCode, {
        sourceType: 'module',
        plugins: ['optionalChaining'],
      });

      this.output = '';
      this.indentLevel = 0;

      // 检查不支持的语法
      this.validateAST(ast);

      // 转换AST到Groovy代码
      this.convertProgram(ast.program);

      return this.output.trim();
    } catch (error) {
      throw new Error(`转换失败: ${error.message}`);
    }
  }

  validateAST(ast) {
    const unsupportedNodes = [];

    traverse(ast, {
      enter: (path) => {
        if (!this.supportedNodeTypes.has(path.node.type)) {
          unsupportedNodes.push({
            type: path.node.type,
            line: path.node.loc?.start?.line || 'unknown',
          });
        }
      },
    });

    if (unsupportedNodes.length > 0) {
      const errorMsg = unsupportedNodes.map((node) => `不支持的语法: ${node.type} (行: ${node.line})`).join('\n');
      throw new Error(`发现不支持的语法，编译中断:\n${errorMsg}`);
    }
  }

  indent() {
    return '    '.repeat(this.indentLevel);
  }

  convertProgram(ast) {
    for (const statement of ast.body) {
      this.convertStatement(statement);
    }
  }

  convertStatement(node) {
    switch (node.type) {
      case 'ClassDeclaration':
        this.convertClass(node);
        break;
      case 'FunctionDeclaration':
        this.convertFunction(node);
        break;
      case 'ExpressionStatement':
        this.output += this.indent() + this.convertExpression(node.expression) + '\n';
        break;
      case 'ReturnStatement':
        this.output += this.indent() + 'return ' + this.convertExpression(node.argument) + '\n';
        break;
      case 'VariableDeclaration':
        this.convertVariableDeclaration(node);
        break;
      case 'ExportNamedDeclaration':
        this.convertExportNamedDeclaration(node);
        break;
      case 'ExportDefaultDeclaration':
        this.convertExportDefaultDeclaration(node);
        break;
      case 'TryStatement':
        this.convertTryStatement(node);
        break;
      case 'IfStatement':
        this.convertIfStatement(node);
        break;
      default:
        throw new Error(`不支持的语句类型: ${node.type}`);
    }
  }

  convertClass(node) {
    this.output += `class ${node.id.name} {\n\n`;
    this.indentLevel++;

    for (const member of node.body.body) {
      if (member.type === 'MethodDefinition' || member.type === 'ClassMethod') {
        this.convertMethod(member);
        this.output += '\n';
      }
    }

    this.indentLevel--;
    this.output += '}\n\n';
  }

  convertMethod(node) {
    const isStatic = node.static;
    const methodName = node.key.name;

    // 处理不同的方法节点类型
    const methodBody = node.value || node; // ClassMethod直接包含body，MethodDefinition在value中
    const params = methodBody.params
      .map((param) => {
        if (param.type === 'Identifier') {
          return param.name;
        }
        throw new Error(`不支持的参数类型: ${param.type}`);
      })
      .join(', ');

    // 添加文档注释（如果有的话）
    if (node.leadingComments) {
      for (const comment of node.leadingComments) {
        this.output += this.indent() + '/**\n';
        this.output += this.indent() + ' * ' + comment.value.trim() + '\n';
        this.output += this.indent() + ' */\n';
      }
    }

    const staticKeyword = isStatic ? 'static ' : '';
    const paramTypes = params
      ? params
          .split(', ')
          .map((p) => `Map ${p}`)
          .join(', ')
      : '';
    this.output += this.indent() + `${staticKeyword}Map ${methodName}(${paramTypes}) {\n`;

    this.indentLevel++;

    // 处理方法体
    const bodyStatements = methodBody.body.body;
    for (const statement of bodyStatements) {
      this.convertStatement(statement);
    }

    this.indentLevel--;
    this.output += this.indent() + '}\n';
  }

  convertFunction(node) {
    const functionName = node.id.name;
    const params = node.params.map((param) => param.name).join(', ');

    this.output += this.indent() + `def ${functionName}(${params}) {\n`;
    this.indentLevel++;

    for (const statement of node.body.body) {
      this.convertStatement(statement);
    }

    this.indentLevel--;
    this.output += this.indent() + '}\n\n';
  }

  convertVariableDeclaration(node) {
    for (const declarator of node.declarations) {
      if (declarator.id.type === 'Identifier') {
        const varName = declarator.id.name;
        const value = declarator.init ? this.convertExpression(declarator.init) : 'null';
        this.output += this.indent() + `def ${varName} = ${value}\n`;
      } else if (declarator.id.type === 'ObjectPattern') {
        // 处理对象解构
        const value = this.convertExpression(declarator.init);

        for (const property of declarator.id.properties) {
          const key = property.key.name;
          const varName = property.value.name;
          this.output += this.indent() + `def ${varName} = ${value}.${key}\n`;
        }
      } else if (declarator.id.type === 'ArrayPattern') {
        // 处理数组解构
        const value = this.convertExpression(declarator.init);

        for (let i = 0; i < declarator.id.elements.length; i++) {
          const element = declarator.id.elements[i];
          if (element) {
            const varName = element.name;
            this.output += this.indent() + `def ${varName} = ${value}[${i}]\n`;
          }
        }
      }
    }
  }

  convertExpression(node) {
    if (!node) return 'null';

    switch (node.type) {
      case 'ObjectExpression':
        return this.convertObjectExpression(node);
      case 'ArrayExpression':
        return this.convertArrayExpression(node);
      case 'ConditionalExpression':
        return this.convertConditionalExpression(node);
      case 'LogicalExpression':
        return this.convertLogicalExpression(node);
      case 'BinaryExpression':
        return this.convertBinaryExpression(node);
      case 'MemberExpression':
        return this.convertMemberExpression(node);
      case 'OptionalMemberExpression':
        return this.convertOptionalMemberExpression(node);
      case 'Identifier':
        return node.name;
      case 'Literal':
      case 'StringLiteral':
        return typeof node.value === 'string' ? `'${node.value}'` : String(node.value);
      case 'NumericLiteral':
        return String(node.value);
      case 'BooleanLiteral':
        return String(node.value);
      case 'NullLiteral':
        return 'null';
      case 'CallExpression':
        return this.convertCallExpression(node);
      case 'OptionalCallExpression':
        return this.convertOptionalCallExpression(node);
      case 'NewExpression':
        return this.convertNewExpression(node);
      case 'TemplateLiteral':
        return this.convertTemplateLiteral(node);
      case 'ArrowFunctionExpression':
        return this.convertArrowFunctionExpression(node);
      case 'UnaryExpression':
        return this.convertUnaryExpression(node);
      case 'AssignmentExpression':
        return this.convertAssignmentExpression(node);
      default:
        throw new Error(`不支持的表达式类型: ${node.type}`);
    }
  }

  convertObjectExpression(node) {
    if (node.properties.length === 0) {
      return '[:]';
    }

    const properties = node.properties.map((prop) => {
      const key = prop.key.type === 'Identifier' ? prop.key.name : prop.key.value;
      const value = this.convertExpression(prop.value);
      return `${key}: ${value}`;
    });

    if (properties.length === 1) {
      return `[${properties[0]}]`;
    }

    const indent = this.indent() + '    ';
    return '[\n' + properties.map((prop) => indent + prop).join(',\n') + '\n' + this.indent() + ']';
  }

  convertArrayExpression(node) {
    if (node.elements.length === 0) {
      return '[]';
    }

    const elements = node.elements.map((element) => this.convertExpression(element));
    return `[${elements.join(', ')}]`;
  }

  convertConditionalExpression(node) {
    const test = this.convertExpression(node.test);
    const consequent = this.convertExpression(node.consequent);
    const alternate = this.convertExpression(node.alternate);
    return `${test} ? ${consequent} : ${alternate}`;
  }

  convertLogicalExpression(node) {
    const left = this.convertExpression(node.left);
    const right = this.convertExpression(node.right);

    // 转换逻辑操作符
    let operator;
    switch (node.operator) {
      case '||':
        operator = '?:';
        break;
      case '&&':
        operator = '&&';
        break;
      default:
        operator = node.operator;
    }

    return `${left} ${operator} ${right}`;
  }

  convertBinaryExpression(node) {
    const left = this.convertExpression(node.left);
    const right = this.convertExpression(node.right);

    // 转换JavaScript的严格相等操作符到Groovy
    let operator = node.operator;
    switch (node.operator) {
      case '===':
        operator = '==';
        break;
      case '!==':
        operator = '!=';
        break;
      default:
        operator = node.operator;
    }

    return `${left} ${operator} ${right}`;
  }

  convertMemberExpression(node) {
    const object = this.convertExpression(node.object);
    const property = node.computed ? `[${this.convertExpression(node.property)}]` : `.${node.property.name}`;
    return `${object}${property}`;
  }

  convertOptionalMemberExpression(node) {
    const object = this.convertExpression(node.object);
    const property = node.computed ? `[${this.convertExpression(node.property)}]` : `.${node.property.name}`;
    return `${object}?.${property.substring(1)}`; // 移除开头的点
  }

  /**
   * 处理特殊的全局函数调用
   */
  convertGlobalFunctionCall(callee, args) {
    // 特殊处理 Date.now()
    if (callee === 'Date.now') {
      return 'System.currentTimeMillis()';
    }

    // 特殊处理 JSON.parse
    if (callee === 'JSON.parse') {
      return `new groovy.json.JsonSlurper().parseText(${args})`;
    }

    // 特殊处理 decodeURIComponent
    if (callee === 'decodeURIComponent') {
      return `java.net.URLDecoder.decode(${args}, 'UTF-8')`;
    }

    // 特殊处理 Number() 函数
    if (callee === 'Number') {
      if (!args) {
        return '0';
      }
      // Number() 函数在 Groovy 中可以直接使用，但需要处理特殊情况
      return `(${args} ?: 0) as BigDecimal`;
    }
    return null;
  }

  /**
   * 处理方法调用转换（如 includes -> contains, map -> collect）
   * @param {Object} node - AST 节点
   * @param {string} args - 方法参数
   * @param {string} chainOperator - 链操作符 ('.' 或 '?.')
   * @param {boolean} isOptionalCallExpression - 是否是 OptionalCallExpression 节点本身是可选的
   */
  convertMethodCall(node, args, chainOperator = '', isOptionalCallExpression = false) {
    if (node.callee.type === 'MemberExpression' || node.callee.type === 'OptionalMemberExpression') {
      const method = node.callee.property.name;
      const object = this.convertExpression(node.callee.object);

      // includes -> contains
      if (method === 'includes') {
        // 如果是可选调用表达式且节点的 optional 为 true（foo?.includes?.()），需要添加?.call
        // 否则只做方法名转换（foo?.includes()）
        if (isOptionalCallExpression) {
          return `${object}?.contains?.call(${args})`;
        }
        return `${object}${chainOperator}contains(${args})`;
      }

      // map -> collect
      if (method === 'map') {
        if (isOptionalCallExpression) {
          return `${object}?.collect?.call(${args})`;
        }
        return `${object}${chainOperator}collect(${args})`;
      }
    }

    return null;
  }

  convertCallExpression(node) {
    const callee = this.convertExpression(node.callee);
    const args = node.arguments.map((arg) => this.convertExpression(arg)).join(', ');

    // 处理全局函数调用
    const globalFunctionResult = this.convertGlobalFunctionCall(callee, args);
    if (globalFunctionResult) {
      return globalFunctionResult;
    }

    // 处理方法调用转换
    const methodResult = this.convertMethodCall(node, args, '.');
    if (methodResult) {
      return methodResult;
    }

    return `${callee}(${args})`;
  }

  convertOptionalCallExpression(node) {
    const args = node.arguments.map((arg) => this.convertExpression(arg)).join(', ');

    // 处理方法调用转换（可选链）
    // 只有当调用本身是可选的（node.optional === true）时，才添加 ?.call
    const methodResult = this.convertMethodCall(node, args, '?.', node.optional);
    if (methodResult) {
      return methodResult;
    }

    const callee = this.convertExpression(node.callee);

    // 可选调用表达式 foo?.() 转换为 Groovy 的 ?.call()
    // JavaScript: foo?.()
    // Groovy: foo?.call()
    // 当 node.optional === true 时使用 ?.call()，否则使用 .call()
    const callOperator = node.optional ? '?.' : '.';
    return `${callee}${callOperator}call(${args})`;
  }

  convertNewExpression(node) {
    const callee = this.convertExpression(node.callee);
    const args = node.arguments.map((arg) => this.convertExpression(arg)).join(', ');
    return `new ${callee}(${args})`;
  }

  convertExportNamedDeclaration(node) {
    // 对于export class，我们只转换类本身，忽略export关键字
    if (node.declaration) {
      this.convertStatement(node.declaration);
    }
  }

  convertExportDefaultDeclaration(node) {
    // 对于export default，我们只转换声明本身，忽略export关键字
    if (node.declaration) {
      this.convertStatement(node.declaration);
    }
  }

  convertTemplateLiteral(node) {
    // 模板字符串转换为Groovy的字符串插值
    // JavaScript: `${utm_source}${utm_medium ? '_' + utm_medium : ''}`
    // Groovy: "${utm_source}${utm_medium ? '_' + utm_medium : ''}".toString()
    // 添加 .toString() 以避免后端解析 GStringImpl 的问题

    let result = '"';

    for (let i = 0; i < node.quasis.length; i++) {
      const quasi = node.quasis[i];
      const expression = node.expressions[i];

      // 添加静态文本部分
      if (quasi.value.raw) {
        result += quasi.value.raw;
      }

      // 添加表达式部分
      if (expression) {
        result += '${' + this.convertExpression(expression) + '}';
      }
    }

    result += '"';

    // 添加 .toString() 方法调用以确保后端能正确解析
    return result + '.toString()';
  }

  convertTryStatement(node) {
    this.output += this.indent() + 'try {\n';
    this.indentLevel++;

    // 处理 try 块
    for (const statement of node.block.body) {
      this.convertStatement(statement);
    }

    this.indentLevel--;

    // 处理 catch 块
    if (node.handler) {
      const paramName = node.handler.param ? node.handler.param.name : 'e';
      this.output += this.indent() + `} catch (${paramName}) {\n`;
      this.indentLevel++;

      for (const statement of node.handler.body.body) {
        this.convertStatement(statement);
      }

      this.indentLevel--;
    }

    // 处理 finally 块
    if (node.finalizer) {
      this.output += this.indent() + '} finally {\n';
      this.indentLevel++;

      for (const statement of node.finalizer.body) {
        this.convertStatement(statement);
      }

      this.indentLevel--;
    }

    this.output += this.indent() + '}\n';
  }

  convertIfStatement(node) {
    const test = this.convertExpression(node.test);
    this.output += this.indent() + `if (${test}) {\n`;
    this.indentLevel++;

    // 处理 if 块
    if (node.consequent.type === 'BlockStatement') {
      for (const statement of node.consequent.body) {
        this.convertStatement(statement);
      }
    } else {
      this.convertStatement(node.consequent);
    }

    this.indentLevel--;

    // 处理 else 块
    if (node.alternate) {
      this.output += this.indent() + '} else ';

      if (node.alternate.type === 'BlockStatement') {
        this.output += '{\n';
        this.indentLevel++;

        for (const statement of node.alternate.body) {
          this.convertStatement(statement);
        }

        this.indentLevel--;
        this.output += this.indent() + '}\n';
      } else if (node.alternate.type === 'IfStatement') {
        // 处理 else if
        this.convertIfStatement(node.alternate);
      } else {
        this.output += '{\n';
        this.indentLevel++;
        this.convertStatement(node.alternate);
        this.indentLevel--;
        this.output += this.indent() + '}\n';
      }
    } else {
      this.output += this.indent() + '}\n';
    }
  }

  convertArrowFunctionExpression(node) {
    const params = node.params
      .map((param) => {
        if (param.type === 'Identifier') {
          return param.name;
        } else if (param.type === 'ObjectPattern') {
          // 处理对象解构参数
          return 'params';
        } else if (param.type === 'ArrayPattern') {
          // 处理数组解构参数
          return 'params';
        }
        return param.name;
      })
      .join(', ');

    if (node.body.type === 'BlockStatement') {
      throw new Error('暂不支持箭头函数中使用块级作用域，请直接return结果');
    } else {
      // 无大括号的箭头函数，直接返回表达式
      const bodyCode = this.convertExpression(node.body);
      return `{ ${params} -> ${bodyCode} }`;
    }
  }

  convertUnaryExpression(node) {
    const argument = this.convertExpression(node.argument);

    // 处理不同的一元操作符
    switch (node.operator) {
      case '!':
        return `!${argument}`;
      case '-':
        return `-${argument}`;
      case '+':
        return `+${argument}`;
      default:
        throw new Error(`未支持的一元操作符`);
    }
  }

  convertAssignmentExpression(node) {
    const left = this.convertExpression(node.left);
    const right = this.convertExpression(node.right);

    // 处理不同的赋值操作符
    switch (node.operator) {
      case '=':
        return `${left} = ${right}`;
      case '+=':
        return `${left} += ${right}`;
      case '-=':
        return `${left} -= ${right}`;
      case '*=':
        return `${left} *= ${right}`;
      case '/=':
        return `${left} /= ${right}`;
      case '%=':
        return `${left} %= ${right}`;
      default:
        throw new Error(`不支持的赋值操作符: ${node.operator}`);
    }
  }
}

const { getDSLTemplate } = require('./template');

module.exports = JSToGroovyTranspiler;
module.exports.getDSLTemplate = getDSLTemplate;
