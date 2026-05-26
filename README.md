# js-to-groovy

An AST-based JavaScript to Groovy code transpiler. It parses JavaScript code using Babel's parser, traverses the AST, and generates equivalent Groovy code.

## Features

- ✅ Class definition and method conversion
- ✅ Static method support
- ✅ Object literal to Groovy Map syntax conversion
- ✅ Array literal conversion
- ✅ Optional chaining operator (`?.`) conversion
- ✅ Logical OR operator (`||`) to Groovy's Elvis operator (`?:`)
- ✅ Logical AND operator (`&&`) conversion
- ✅ Ternary operator conversion
- ✅ ES6 module export statement (`export`) support
- ✅ Unsupported syntax detection with error messages
- ✅ try-catch-finally statement support
- ✅ if-else and else-if statement support
- ✅ Object destructuring and array destructuring support
- ✅ Array method chaining support (e.g., `map` → `collect`)
- ✅ Simple arrow function support (expression form only)
- ✅ `JSON.parse` → Groovy `JsonSlurper`
- ✅ Template literal → Groovy string interpolation
- ✅ Unary operator support (`!`, `-`, `+`)
- ✅ Assignment operator support (`=`, `+=`, `-=`, `*=`, `/=`, `%=`)

## Supported Syntax

### JavaScript Input

```javascript
export class ConfigBuilder {
  createConfig(props, commonparams) {
    try {
      const { dataInput, componentInfo } = props || {};
      const { pick } = commonparams || {};

      return {
        appkey: '',
        params: {
          type: dataInput?.inputType || '',
          schemeId: dataInput?.activityInfo?.activityId ? '1' : '2',
          instanceKey: componentInfo?.instanceID && 'exists',
          latitude: pick?.lat || 0.0,
          items: ['a', 'b', 'c'].map((item) => ({ id: item })),
        },
      };
    } catch (error) {
      console.error('Config creation failed', error);
      return { error: true };
    }
  }

  static create(props, commonparams) {
    if (!props) return null;
    return new ConfigBuilder().createConfig(props, commonparams);
  }
}
```

### Groovy Output

```groovy
class ConfigBuilder {

    Map createConfig(Map props, Map commonparams) {
        try {
            def dataInput = props?.dataInput
            def componentInfo = props?.componentInfo
            def pick = commonparams?.pick

            return [
                appkey: '',
                params: [
                    type: dataInput?.inputType ?: '',
                    schemeId: dataInput?.activityInfo?.activityId ? '1' : '2',
                    instanceKey: componentInfo?.instanceID && 'exists',
                    latitude: pick?.lat ?: 0.0,
                    items: ['a', 'b', 'c'].collect({ item -> [id: item] })
                ]
            ]
        } catch (error) {
            console.error('Config creation failed', error)
            return [error: true]
        }
    }

    static Map create(Map props, Map commonparams) {
        if (!props) {
            return null
        }
        return new ConfigBuilder().createConfig(props, commonparams)
    }
}
```

## Installation

```bash
npm install js-to-groovy
```

## Usage

### Command Line

```bash
# Transpile a file and output to console
npx js2groovy test/sample.js

# Transpile a file and save to output file
npx js2groovy test/sample.js -o output.groovy

# Show verbose information
npx js2groovy test/sample.js -v
```

### Programmatic API

```javascript
const JSToGroovyTranspiler = require('js-to-groovy');

const transpiler = new JSToGroovyTranspiler();
const jsCode = `
class TestClass {
    test(param) {
        const { prop } = param || {};
        if (!prop) return 'default';
        try {
            return { value: JSON.parse(prop) };
        } catch (e) {
            return { error: true };
        }
    }
}`;

try {
  const groovyCode = transpiler.transpile(jsCode);
  console.log(groovyCode);
} catch (error) {
  console.error('Transpilation failed:', error.message);
}
```

## Running Tests

```bash
npm test
```

## Special Conversions

The transpiler handles some common JavaScript patterns with special conversion logic:

- `JSON.parse()` → `new groovy.json.JsonSlurper().parseText()`
- `decodeURIComponent()` → `java.net.URLDecoder.decode(str, 'UTF-8')`
- `Date.now()` → `System.currentTimeMillis()`
- `Number()` → `(value ?: 0) as BigDecimal`
- JavaScript `map()` → Groovy `collect()`
- JavaScript `includes()` → Groovy `contains()`
- Arrow functions → Groovy closure syntax `{ param -> body }` (expression form only)
- Object destructuring `const { a, b } = obj` → `def a = obj.a` and `def b = obj.b`
- Array destructuring `const [a, b] = arr` → `def a = arr[0]` and `def b = arr[1]`
- Template literals → Groovy string interpolation with `.toString()` for compatibility
- Logical OR `||` → Groovy's Elvis operator `?:`
- Strict equality `===` → `==`, `!==` → `!=`

### Special Syntax Conversion Example

#### JavaScript Input

```javascript
function processData(onceData) {
  if (!onceData) return [];

  try {
    const { previewProductInfo } = JSON.parse(onceData);

    return previewProductInfo.split('#').map((item) => {
      const [shopId, spuId] = item.split('_');

      return {
        shopId: shopId || '',
        spuId: spuId || '',
      };
    });
  } catch (error) {
    return [];
  }
}
```

#### Groovy Output

```groovy
def processData(onceData) {
    if (!onceData) {
        return []
    }

    try {
        def previewProductInfo = new groovy.json.JsonSlurper().parseText(onceData).previewProductInfo

        return previewProductInfo.split('#').collect({ item ->
            def shopId = item.split('_')[0]
            def spuId = item.split('_')[1]

            [
                shopId: shopId ?: '',
                spuId: spuId ?: ''
            ]
        })
    } catch (error) {
        return []
    }
}
```

## How It Works

The project uses Babel for AST parsing and traversal:

- `@babel/parser`: Parses JavaScript code into AST
- `@babel/traverse`: Traverses and analyzes AST nodes
- `@babel/types`: AST node type definitions

The transpiler uses the visitor pattern to generate corresponding Groovy code for each supported AST node type.

## Limitations

While the transpiler supports many JavaScript syntax features, there are some limitations:

- Arrow functions only support the expression form (no block body)
- Some advanced ES6+ features are not fully supported, including:
  - No nested destructuring, destructuring defaults, or destructuring renaming
  - No advanced class features (class fields, private methods/fields, static blocks, class inheritance)
  - No async programming features (Promise, async/await, Generator)
  - No full module system (only basic `export` is supported, no `import`)
  - No Proxy, Reflect, Symbol, nullish coalescing operator (`??`), spread operator (`...`), etc.
  - No `for...of` loops and other iterator-related features

- Specific JavaScript library or framework syntax requires manual conversion:
  - No React/JSX syntax support
  - No decorator support
  - Only a few JavaScript APIs are specially handled (e.g., JSON.parse, decodeURIComponent, Date.now, Number)
  - Only `map` and `includes` array methods are specially handled; others (filter, reduce, etc.) require manual conversion
  - No browser API or DOM operation support
  - Regular expression syntax differences between JavaScript and Groovy require manual adjustment

When unsupported syntax is encountered, the transpiler provides detailed error messages including the unsupported syntax type and the line number where the error occurs.

## License

MIT
