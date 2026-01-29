# Security Vulnerabilities Tracking

**Last Updated**: January 29, 2026  
**Total Vulnerabilities**: 10 (5 moderate, 5 high)  
**Status**: Documented - Deferred to next major version

---

## 🔒 Current Vulnerabilities

### 1. ESLint Stack Overflow (Moderate) - 5 issues
**Package**: `eslint <9.26.0`  
**Current Version**: 8.57.1  
**Fixed Version**: 9.39.2  
**Severity**: Moderate

**Issue**: Stack Overflow when serializing objects with circular references  
**Advisory**: https://github.com/advisories/GHSA-p5wg-g6qr-c7cg

**Affected Packages**:
- eslint
- @typescript-eslint/eslint-plugin
- @typescript-eslint/parser
- @typescript-eslint/type-utils
- @typescript-eslint/utils

**Impact**: 
- Dev dependency only (linting tool)
- Only affects build-time, not runtime
- Requires circular reference to trigger

**Fix Required**: 
```bash
npm install eslint@9.39.2 --save-dev
```
**Breaking Change**: Yes (ESLint 8 → 9)

---

### 2. node-tar Path Traversal (High) - 5 issues
**Package**: `tar <=7.5.6`  
**Severity**: High

**Issues**:
1. Arbitrary File Overwrite via insufficient path sanitization
   - Advisory: https://github.com/advisories/GHSA-8qq5-rm4j-mr97
2. Race Condition in path reservations (macOS APFS)
   - Advisory: https://github.com/advisories/GHSA-r6q2-hw4h-h46w
3. File creation/overwrite via hardlink traversal
   - Advisory: https://github.com/advisories/GHSA-34x7-hfp2-rc4v

**Affected Packages**:
- tar
- cacache
- make-fetch-happen
- node-gyp
- sqlite3

**Impact**:
- Dev dependency only (used by sqlite3 build process)
- Only affects build-time operations
- Requires malicious tar archive to exploit

**Fix Required**:
```bash
npm audit fix --force
```
**Breaking Change**: Yes (would update sqlite3 to 5.0.2)

---

## ⚖️ Risk Assessment

### Current Risk Level: **LOW** ✅

**Rationale**:
1. **All are dev dependencies** - not shipped to production
2. **Build-time only** - don't affect runtime security
3. **Require specific conditions** to exploit:
   - ESLint: Need circular references in config
   - tar: Need to process malicious archives
4. **Standard development environment** - not CI/CD or public server

### Acceptable for Development: **YES**

---

## 📋 Remediation Plan

### Option 1: Defer to v1.0.0 (Recommended)
- **When**: Next major version release
- **Why**: Can handle breaking changes properly
- **Timeline**: ~2-4 weeks (Feb 2026)
- **Risk**: Low (dev-only vulnerabilities)

### Option 2: Force Update Now (Not Recommended)
- **Command**: `npm audit fix --force`
- **Risk**: May break existing linting rules and build
- **Requires**: 
  - Update ESLint config for v9
  - Test all linting rules
  - Update CI/CD if configured

### Option 3: Selective Manual Update
- **When**: As time permits
- **Process**:
  1. Test ESLint 9 in separate branch
  2. Update .eslintrc.json for compatibility
  3. Fix any new linting errors
  4. Merge when stable

---

## ✅ Mitigation Steps (Current)

1. **Documented**: All vulnerabilities tracked in this file
2. **Monitored**: Run `npm audit` weekly
3. **Isolated**: Dev dependencies only, not in production
4. **Planned**: Scheduled for v1.0.0 release

---

## 🔄 Update Log

| Date | Action | Result |
|------|--------|--------|
| 2026-01-29 | Initial audit | 10 vulnerabilities identified |
| 2026-01-29 | Attempted `npm audit fix` | No non-breaking fixes available |
| 2026-01-29 | Attempted `npm update tar` | Version constraint prevented update |
| 2026-01-29 | **Decision**: Defer to v1.0.0 | Risk accepted, documented |

---

## 📊 Tracking

**GitHub Issue**: #TBD  
**Milestone**: v1.0.0  
**Assignee**: TBD  
**Priority**: P2 (Medium)

---

## 🛡️ Security Policy

For security concerns, see [SECURITY.md](SECURITY.md) (if exists) or contact repository owner.

**DO NOT** run `npm audit fix --force` without:
1. Creating a backup branch
2. Reviewing breaking changes
3. Testing all functionality
4. Updating documentation
