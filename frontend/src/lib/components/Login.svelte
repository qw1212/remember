<script lang="ts">
  import { setMasterPassword, verifyMasterPassword, isMasterPasswordSet } from '../api';
  
  let password = '';
  let isSetup = false;
  let isLoading = false;
  let error = '';
  let success = '';
  
  // 检查是否已设置主密码
  async function checkMasterPassword() {
    try {
      isSetup = await isMasterPasswordSet();
    } catch (e) {
      console.error('检查主密码失败:', e);
    }
  }
  
  // 初始化时检查
  checkMasterPassword();
  
  async function handleSubmit() {
    if (!password) {
      error = '请输入密码';
      return;
    }
    
    isLoading = true;
    error = '';
    success = '';
    
    try {
      if (isSetup) {
        // 验证主密码
        const result = await verifyMasterPassword(password);
        if (result.success) {
          success = '验证成功！';
          // 触发登录成功事件
          window.dispatchEvent(new CustomEvent('login-success'));
        } else {
          error = result.error || '验证失败';
        }
      } else {
        // 设置主密码
        const result = await setMasterPassword(password);
        if (result.success) {
          success = '主密码设置成功！';
          isSetup = true;
          // 触发登录成功事件
          window.dispatchEvent(new CustomEvent('login-success'));
        } else {
          error = result.error || '设置失败';
        }
      }
    } catch (e) {
      error = `操作失败: ${e}`;
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="login-container">
  <div class="login-card">
    <h1 class="login-title">🔐 Remember</h1>
    <p class="login-subtitle">
      {#if isSetup}
        输入主密码解锁您的数据
      {:else}
        设置主密码以保护您的数据
      {/if}
    </p>
    
    <form on:submit|preventDefault={handleSubmit}>
      <div class="form-group">
        <label for="password">主密码</label>
        <input
          type="password"
          id="password"
          bind:value={password}
          placeholder="输入您的主密码"
          disabled={isLoading}
        />
      </div>
      
      {#if error}
        <div class="error-message">{error}</div>
      {/if}
      
      {#if success}
        <div class="success-message">{success}</div>
      {/if}
      
      <button type="submit" class="submit-btn" disabled={isLoading}>
        {#if isLoading}
          处理中...
        {:else if isSetup}
          解锁
        {:else}
          设置密码
        {/if}
      </button>
    </form>
    
    <div class="security-info">
      <p>🛡️ 您的数据使用AES-256加密</p>
      <p>🔑 密钥存储在系统Keychain中</p>
    </div>
  </div>
</div>

<style>
  .login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  
  .login-card {
    background: white;
    padding: 2.5rem;
    border-radius: 1rem;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    width: 100%;
    max-width: 400px;
  }
  
  .login-title {
    text-align: center;
    margin: 0 0 0.5rem 0;
    font-size: 2rem;
    color: #333;
  }
  
  .login-subtitle {
    text-align: center;
    color: #666;
    margin-bottom: 2rem;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #555;
  }
  
  input {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e0e0e0;
    border-radius: 0.5rem;
    font-size: 1rem;
    transition: border-color 0.3s;
    box-sizing: border-box;
  }
  
  input:focus {
    outline: none;
    border-color: #667eea;
  }
  
  .submit-btn {
    width: 100%;
    padding: 0.75rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
  }
  
  .submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  .error-message {
    color: #e74c3c;
    background: #fdeaea;
    padding: 0.75rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    text-align: center;
  }
  
  .success-message {
    color: #27ae60;
    background: #e8f8f0;
    padding: 0.75rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    text-align: center;
  }
  
  .security-info {
    margin-top: 2rem;
    text-align: center;
    color: #888;
    font-size: 0.85rem;
  }
  
  .security-info p {
    margin: 0.25rem 0;
  }
</style>
