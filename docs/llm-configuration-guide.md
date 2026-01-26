# LLM Configuration Guide

## Overview

The Copilot Orchestration Extension (COE) now supports fully configurable LLM connections through VS Code settings. This allows you to connect to any OpenAI-compatible endpoint (LM Studio, Ollama, OpenAI, Azure OpenAI, etc.) without modifying code.

**Key Feature**: Automatic input token limiting to prevent context overflow on local models with strict limits.

---

## Available Settings

All settings are under the `coe.llm` namespace in VS Code settings:

### 1. **LLM Endpoint URL** (`coe.llm.url`)
- **Type**: String
- **Default**: `http://192.168.1.205:1234/v1/chat/completions`
- **Description**: Full OpenAI-compatible endpoint URL

**Examples**:
```json
// LM Studio (default)
"coe.llm.url": "http://192.168.1.205:1234/v1/chat/completions"

// Ollama
"coe.llm.url": "http://localhost:11434/v1/chat/completions"

// OpenAI
"coe.llm.url": "https://api.openai.com/v1/chat/completions"

// Azure OpenAI
"coe.llm.url": "https://your-resource.openai.azure.com/openai/deployments/your-deployment/chat/completions?api-version=2024-02-15-preview"
```

---

### 2. **Model Name** (`coe.llm.model`)
- **Type**: String
- **Default**: `mistralai/ministral-3-14b-reasoning`
- **Description**: Model identifier to use

**Examples**:
```json
// Mistral (LM Studio)
"coe.llm.model": "mistralai/ministral-3-14b-reasoning"

// Llama (Ollama)
"coe.llm.model": "llama3:8b"

// OpenAI
"coe.llm.model": "gpt-4-turbo"

// Azure OpenAI (use deployment name)
"coe.llm.model": "gpt-35-turbo"
```

---

### 3. **Max Output Tokens** (`coe.llm.maxOutputTokens`)
- **Type**: Integer (512-8192)
- **Default**: `2000`
- **Description**: Maximum tokens the model can generate in its response

**Guidance**:
- **Small models (1-3B)**: Use 512-1000 tokens
- **Medium models (7-14B)**: Use 1000-2000 tokens
- **Large models (GPT-4, Claude)**: Use 2000-4096 tokens

```json
"coe.llm.maxOutputTokens": 1500  // Medium-sized responses
```

---

### 4. **Input Token Limit** (`coe.llm.inputTokenLimit`) ⚠️ **CRITICAL**
- **Type**: Integer (1000-32000)
- **Default**: `4000`
- **Description**: Maximum tokens allowed in the prompt we send (enforces context limit)

**Why This Matters**:
Local models often crash or hang when you exceed their context window. This setting **automatically truncates** prompts that are too large.

**Token Estimation**:
- COE estimates tokens as `text.length / 4` (rough approximation)
- If estimated tokens > limit → prompt is truncated to 90% of limit
- Truncation warning is shown in Output channel

**How to Find Your Model's Context Limit**:
- **Mistral 3-14B**: 4000-8000 tokens
- **Llama 3 8B**: 8000 tokens
- **GPT-3.5**: 16000 tokens
- **GPT-4**: 32000 tokens
- **Claude Sonnet**: 200000 tokens

```json
// Conservative setting for 8B local model
"coe.llm.inputTokenLimit": 3000

// Aggressive setting for GPT-4
"coe.llm.inputTokenLimit": 16000
```

---

### 5. **Timeout** (`coe.llm.timeoutSeconds`)
- **Type**: Integer (≥60)
- **Default**: `300` (5 minutes)
- **Description**: How long to wait for LLM response before timeout

**Guidance**:
- **Local models**: 180-600 seconds (can be slow)
- **Cloud APIs**: 60-120 seconds (faster)

```json
"coe.llm.timeoutSeconds": 180  // 3 minutes for local model
```

---

## Quick Setup Examples

### Example 1: LM Studio (Default)
```jsonc
{
  "coe.llm.url": "http://192.168.1.205:1234/v1/chat/completions",
  "coe.llm.model": "mistralai/ministral-3-14b-reasoning",
  "coe.llm.maxOutputTokens": 2000,
  "coe.llm.inputTokenLimit": 4000,
  "coe.llm.timeoutSeconds": 300
}
```

### Example 2: Ollama (Llama3)
```jsonc
{
  "coe.llm.url": "http://localhost:11434/v1/chat/completions",
  "coe.llm.model": "llama3:8b",
  "coe.llm.maxOutputTokens": 1500,
  "coe.llm.inputTokenLimit": 6000,  // Llama3 has 8K context
  "coe.llm.timeoutSeconds": 240
}
```

### Example 3: OpenAI GPT-4
```jsonc
{
  "coe.llm.url": "https://api.openai.com/v1/chat/completions",
  "coe.llm.model": "gpt-4-turbo",
  "coe.llm.maxOutputTokens": 4000,
  "coe.llm.inputTokenLimit": 16000,  // GPT-4 has 32K context
  "coe.llm.timeoutSeconds": 120
}
```

**Note**: For OpenAI/Azure, you'll need to add API key handling separately (not yet implemented).

---

## Step-by-Step Configuration

### Via VS Code UI:

1. **Open Settings**:
   - Press `Ctrl+,` (Windows/Linux) or `Cmd+,` (Mac)
   - Or: File → Preferences → Settings

2. **Search for "coe.llm"**:
   - Type `coe.llm` in the search bar
   - All 5 LLM settings will appear

3. **Configure Each Setting**:
   - Click the pencil icon to edit
   - Enter your desired values
   - Settings save automatically

4. **Reload Window**:
   - Press `Ctrl+Shift+P` → "Reload Window"
   - Or: Developer → Reload Window
   - This applies the new settings

### Via settings.json:

1. **Open settings.json**:
   - Press `Ctrl+Shift+P` → "Preferences: Open Settings (JSON)"

2. **Add configuration**:
   ```json
   {
     "coe.llm.url": "http://localhost:11434/v1/chat/completions",
     "coe.llm.model": "llama3:8b",
     "coe.llm.maxOutputTokens": 1500,
     "coe.llm.inputTokenLimit": 6000,
     "coe.llm.timeoutSeconds": 240
   }
   ```

3. **Save and reload**:
   - Save the file (`Ctrl+S`)
   - Reload window (`Ctrl+Shift+P` → "Reload Window")

---

## Verifying Configuration

After changing settings, check the **COE Orchestrator** output channel to see if settings were loaded:

1. Open Output panel: `Ctrl+`\`
2. Select "COE Orchestrator" from dropdown
3. Look for startup message:
   ```
   ⚙️ LLM Settings:
      URL: http://localhost:11434/v1/chat/completions
      Model: llama3:8b
      Input limit: 6000 tokens
      Output max: 1500 tokens
      Timeout: 240s
   ```

---

## Token Limit Behavior

### How Input Token Limiting Works:

1. **Before sending prompt**:
   - COE estimates tokens: `prompt.length / 4`
   - Logs: `📊 Estimated input tokens: 5000 / 4000`

2. **If estimated > limit**:
   - Truncates prompt to 90% of limit (leaves 10% buffer)
   - Logs: `⚠️ Prompt too large — truncated to fit 4000 tokens`
   - Shows warning notification to user

3. **Sends truncated prompt**:
   - Includes suffix: `[... truncated to fit token limit ...]`
   - LLM still generates response (just with less context)

### Example:
```
Input limit: 4000 tokens
Prompt size: 20,000 characters (~5,000 tokens)

Action: Truncate to 14,400 characters (~3,600 tokens)
Buffer: 10% (400 tokens unused)
Result: LLM receives safe prompt that fits context window
```

---

## Troubleshooting

### Issue: "Request timed out"
**Cause**: LLM took longer than `timeoutSeconds`  
**Fix**: Increase timeout or reduce `inputTokenLimit` (smaller prompts = faster responses)

### Issue: "LLM not responding"
**Cause**: Endpoint URL is incorrect or LLM isn't running  
**Fix**: 
- Verify LM Studio/Ollama is running
- Check URL matches your server's address
- Test URL in browser (should return error, not "connection refused")

### Issue: "Prompt truncated" warning
**Cause**: Task context exceeds `inputTokenLimit`  
**Fix**: 
- **Short-term**: Increase `inputTokenLimit` if model supports it
- **Long-term**: Simplify task descriptions in plan file

### Issue: LLM returns gibberish
**Cause**: Model confused by truncated prompt  
**Fix**: 
- Increase `inputTokenLimit` to avoid truncation
- Use smaller, more focused tasks
- Switch to model with larger context window

---

## Advanced: Dynamic Configuration

Settings are read **every time** you process a task, so you can:

1. Change settings in VS Code
2. Reload window (`Ctrl+Shift+P` → "Reload Window")
3. Process next task → uses new settings immediately

**No need to restart VS Code** — just reload the window!

---

## Summary

| Setting | Default | Purpose | Typical Range |
|---------|---------|---------|---------------|
| `coe.llm.url` | LM Studio URL | Endpoint address | Any OpenAI-compatible URL |
| `coe.llm.model` | ministral-3-14b | Model identifier | Model-specific |
| `coe.llm.maxOutputTokens` | 2000 | Response size limit | 512-8192 |
| `coe.llm.inputTokenLimit` | 4000 | ⚠️ Context window safety | 1000-32000 |
| `coe.llm.timeoutSeconds` | 300 | Wait time before timeout | 60-600 |

**Key Takeaway**: The `inputTokenLimit` setting is your safety net against context overflow. Set it to ~75% of your model's actual context window for best results.

---

## Testing Settings

To verify settings work correctly:

1. **Change inputTokenLimit to 2000**:
   ```json
   "coe.llm.inputTokenLimit": 2000
   ```

2. **Reload window**

3. **Check Output channel** shows:
   ```
   Input limit: 2000 tokens
   ```

4. **Process a task** → should truncate if prompt is large

5. **Revert to 4000** and reload to restore defaults

---

## What's Next?

Future enhancements:
- API key/authentication support for cloud providers
- Per-model presets (auto-configure limits based on model)
- Token usage tracking and cost estimation
- Multi-turn conversation memory management

For now, enjoy full control over your LLM connection! 🚀
