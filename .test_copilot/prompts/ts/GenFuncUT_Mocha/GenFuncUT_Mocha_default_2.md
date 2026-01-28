````markdown
# Result format:
```javascript
// <<<SpecFileName>>>
const { describe, it, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const sinon = require('sinon');
const <<<FunctionName>>> = require('./<<<SourceFileName>>>');
<<<MockCode>>>
// Write your test cases here
```
````