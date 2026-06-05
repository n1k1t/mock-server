### Code style
​
**Imports:**

1. Imports should be in strict order:
  - External default `import a from 'a'`
  - External entity `import { b } from 'b'`
  - Internal entity `import { c } from './c'`
  - Internal default `import d from './d'`
2. Between imports all the types should be empty line (if there are more than 1 import of the same type)
3. Imports of the same type should be sorted by length of code before `from` keyword (from long to short)
​
**Exports:**

1. Exports should be sorted by length of of code before `from` keyword (from long to short)
2. Exports should be places right after imports
​
**Objects:**

1. Save empty lines between object properties like on code examples

**Function:**

1. DO NOT use `function keyword`. Use arrow functions instead
