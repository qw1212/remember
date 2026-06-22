<script lang="ts">
  import { saveCredential, updateCredential, generatePassword, type Credential } from '../api';
  
  export let credential: Credential | null = null;
  export let onClose: () => void;
  export let onSave: () => void;
  
  let title = credential?.title || '';
  let username = credential?.username || '';
  let password = credential?.password || '';
  let url = credential?.url || '';
  let notes = credential?.notes || '';
  let category = credential?.category || 'general';
  let isFavorite = credential?.is_favorite || false;
  let isLoading = false;
  let error = '';
  let showPassword = false;
  let showGenerator = false;
  
  // 密码生成器选项
  let genLength = 16;
  let genUppercase = true;
  let genLowercase = true;
  let genNumbers = true;
  let genSymbols = true;
  
  const isEditing = !!credential;
  
  // 计算密码强度
  $: passwordStrength = calculatePasswordStrength(password);
  
  function calculatePasswordStrength(pwd: string): { score: number; label: string; color: string } {
    if (!pwd) return { score: 0, label: '无', color: '#ccc' };
    
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (pwd.length >= 16) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;
    
    if (score <= 2) return { score: score / 7, label: '弱', color: '#e74c3c' };
    if (score <= 4) return { score: score / 7, label: '中', color: '#f59e0b' };
    if (score <= 5) return { score: score / 7, label: '强', color: '#10b981' };
    return { score: 1, label: '非常强', color: '#059669' };
  }
  
  // 生成密码
  async function handleGeneratePassword() {
    try {
      password = await generatePassword(genLength, genUppercase, genLowercase, genNumbers, genSymbols);
    } catch (e) {
      error = `生成密码失败: ${e}`;
    }
  }
  
  // 保存凭证
  async function handleSubmit() {
    if (!title) {
      error = '请输入标题';
      return;
    }
    if (!password) {
      error = '请输入密码';
      return;
    }
    
    isLoading = true;
    error = '';
    
    const now = new Date().toISOString();
    const credentialData: Credential = {
      id: credential?.id || crypto.randomUUID(),
      title,
      username: username || undefined,
      password,
      url: url || undefined,
      notes: notes || undefined,
      category,
      tags: [],
      created_at: credential?.created_at || now,
      updated_at: now,
      is_favorite: isFavorite,
    };
    
    try {
      const result = isEditing 
        ? await updateCredential(credentialData)
        : await saveCredential(credentialData);
      
      if (result.success) {
        onSave();
        onClose();
      } else {
        error = result.error || '保存失败';
      }
    } catch (e) {
      error = `保存失败: ${e}`;
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="form-overlay" on:click|self={onClose}>
  <div class="form-container">
    <div class="form-header">
      <h2>{isEditing ? '编辑凭证' : '添加凭证'}</h2>
      <button class="close-btn" on:click={onClose} aria-label="关闭">×</button>
    </div>
    
    {#if error}
      <div class="error-message">{error}</div>
    {/if}
    
    <form on:submit|preventDefault={handleSubmit}>
      <div class="form-group">
        <label for="title">标题 *</label>
        <input
          type="text"
          id="title"
          bind:value={title}
          placeholder="例如：GitHub、淘宝"
          disabled={isLoading}
        />
      </div>
      
      <div class="form-group">
        <label for="username">用户名</label>
        <input
          type="text"
          id="username"
          bind:value={username}
          placeholder="邮箱或用户名"
          disabled={isLoading}
        />
      </div>
      
      <div class="form-group">
        <label for="password">密码 *</label>
        <div class="password-input">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            bind:value={password}
            placeholder="输入密码"
            disabled={isLoading}
          />
          <button
            type="button"
            class="toggle-password"
            on:click={() => showPassword = !showPassword}
          >
            {showPassword ? '隐藏' : '显示'}
          </button>
          <button
            type="button"
            class="generate-btn"
            on:click={() => showGenerator = !showGenerator}
            disabled={isLoading}
          >
            生成
          </button>
        </div>
        
        {#if password}
          <div class="strength-bar">
            <div class="strength-fill" style="width: {passwordStrength.score * 100}%; background: {passwordStrength.color}"></div>
          </div>
          <span class="strength-label" style="color: {passwordStrength.color}">强度: {passwordStrength.label}</span>
        {/if}
        
        {#if showGenerator}
          <div class="generator-panel">
            <div class="gen-option">
              <label>长度: {genLength}</label>
              <input type="range" min="8" max="64" bind:value={genLength} />
            </div>
            <div class="gen-checkboxes">
              <label><input type="checkbox" bind:checked={genUppercase} /> 大写字母</label>
              <label><input type="checkbox" bind:checked={genLowercase} /> 小写字母</label>
              <label><input type="checkbox" bind:checked={genNumbers} /> 数字</label>
              <label><input type="checkbox" bind:checked={genSymbols} /> 符号</label>
            </div>
            <button type="button" class="gen-execute-btn" on:click={handleGeneratePassword}>
              生成密码
            </button>
          </div>
        {/if}
      </div>
      
      <div class="form-group">
        <label for="url">网址</label>
        <input
          type="url"
          id="url"
          bind:value={url}
          placeholder="https://example.com"
          disabled={isLoading}
        />
      </div>
      
      <div class="form-group">
        <label for="category">分类</label>
        <select id="category" bind:value={category} disabled={isLoading}>
          <option value="general">通用</option>
          <option value="social">社交媒体</option>
          <option value="development">开发</option>
          <option value="shopping">购物</option>
          <option value="finance">金融</option>
          <option value="email">邮箱</option>
          <option value="other">其他</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="notes">备注</label>
        <textarea
          id="notes"
          bind:value={notes}
          placeholder="可选备注信息"
          disabled={isLoading}
          rows="3"
        ></textarea>
      </div>
      
      <div class="form-group checkbox-group">
        <label>
          <input
            type="checkbox"
            bind:checked={isFavorite}
            disabled={isLoading}
          />
          收藏
        </label>
      </div>
      
      <div class="form-actions">
        <button type="button" class="cancel-btn" on:click={onClose} disabled={isLoading}>
          取消
        </button>
        <button type="submit" class="save-btn" disabled={isLoading}>
          {isLoading ? '保存中...' : (isEditing ? '更新' : '保存')}
        </button>
      </div>
    </form>
  </div>
</div>

<style>
  .form-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .form-container {
    background: white;
    border-radius: 1rem;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    padding: 2rem;
  }
  
  .form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  
  .form-header h2 {
    margin: 0;
    color: #333;
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #666;
    padding: 0.5rem;
  }
  
  .close-btn:hover {
    color: #333;
  }
  
  .error-message {
    color: #e74c3c;
    background: #fdeaea;
    padding: 0.75rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .form-group {
    margin-bottom: 1.25rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #555;
  }
  
  input, select, textarea {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e0e0e0;
    border-radius: 0.5rem;
    font-size: 1rem;
    transition: border-color 0.3s;
    box-sizing: border-box;
  }
  
  input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: #667eea;
  }
  
  .password-input {
    display: flex;
    gap: 0.5rem;
  }
  
  .password-input input {
    flex: 1;
  }
  
  .toggle-password, .generate-btn {
    padding: 0.75rem;
    border: 2px solid #e0e0e0;
    border-radius: 0.5rem;
    background: white;
    cursor: pointer;
    font-size: 0.9rem;
    color: #666;
  }
  
  .toggle-password:hover, .generate-btn:hover {
    background: #f0f0f0;
  }
  
  .checkbox-group label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: normal;
    cursor: pointer;
  }
  
  .checkbox-group input {
    width: auto;
  }
  
  .form-actions {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
  }
  
  .cancel-btn, .save-btn {
    flex: 1;
    padding: 0.75rem;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s;
  }
  
  .cancel-btn {
    background: #f0f0f0;
    color: #666;
  }
  
  .cancel-btn:hover {
    background: #e0e0e0;
  }
  
  .save-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
  
  .save-btn:hover {
    transform: translateY(-2px);
  }
  
  .save-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
  
  .strength-bar {
    height: 4px;
    background: #e0e0e0;
    border-radius: 2px;
    margin-top: 0.5rem;
    overflow: hidden;
  }
  
  .strength-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.3s, background 0.3s;
  }
  
  .strength-label {
    font-size: 0.8rem;
    margin-top: 0.25rem;
    display: inline-block;
  }
  
  .generator-panel {
    background: #f8f9fa;
    border: 1px solid #e0e0e0;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-top: 0.75rem;
  }
  
  .gen-option {
    margin-bottom: 0.75rem;
  }
  
  .gen-option label {
    display: block;
    margin-bottom: 0.25rem;
    font-size: 0.9rem;
    color: #555;
  }
  
  .gen-option input[type="range"] {
    width: 100%;
    padding: 0;
    border: none;
  }
  
  .gen-checkboxes {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }
  
  .gen-checkboxes label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: #555;
    cursor: pointer;
    font-weight: normal;
    margin-bottom: 0;
  }
  
  .gen-checkboxes input {
    width: auto;
    padding: 0;
  }
  
  .gen-execute-btn {
    width: 100%;
    padding: 0.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 0.9rem;
  }
  
  .gen-execute-btn:hover {
    opacity: 0.9;
  }
</style>
