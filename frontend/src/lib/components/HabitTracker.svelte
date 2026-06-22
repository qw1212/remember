<script lang="ts">
  import { onMount } from 'svelte';
  import type { Habit, HabitRecord } from '../api';
  import {
    getHabits,
    saveHabit,
    deleteHabit,
    getHabitRecords,
    saveHabitRecord,
    deleteHabitRecord,
  } from '../api';

  let habits: Habit[] = [];
  let records: Map<string, HabitRecord[]> = new Map();
  let isLoading = false;
  let showForm = false;
  let editingHabit: Habit | null = null;
  let error = '';

  // 表单数据
  let formName = '';
  let formDescription = '';
  let formIcon = '✅';
  let formColor = '#667eea';
  let formFrequency = 'daily';
  let formTargetDays = [0, 1, 2, 3, 4, 5, 6];

  const iconOptions = ['✅', '🏃', '📚', '🧘', '💪', '🎯', '💻', '🎵', '🌅', '💤', '🥤', '🥗'];
  const colorOptions = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#a18cd1', '#fbc2eb'];
  const dayNames = ['日', '一', '二', '三', '四', '五', '六'];

  onMount(() => {
    loadData();
  });

  async function loadData() {
    isLoading = true;
    error = '';
    try {
      const response = await getHabits();
      if (response.success && response.data) {
        habits = response.data;
        // 加载每个习惯的打卡记录
        for (const habit of habits) {
          const recordsResponse = await getHabitRecords(habit.id);
          if (recordsResponse.success && recordsResponse.data) {
            records.set(habit.id, recordsResponse.data);
          }
        }
        records = records; // 触发响应式更新
      }
    } catch (e) {
      error = `加载数据失败: ${e instanceof Error ? e.message : String(e)}`;
    } finally {
      isLoading = false;
    }
  }

  function getTodayStr(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  function isCheckedToday(habitId: string): boolean {
    const today = getTodayStr();
    const habitRecords = records.get(habitId) || [];
    return habitRecords.some(r => r.date === today && r.completed);
  }

  function getStreak(habitId: string): number {
    const habitRecords = records.get(habitId) || [];
    const sortedDates = habitRecords
      .filter(r => r.completed)
      .map(r => r.date)
      .sort()
      .reverse();

    if (sortedDates.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];

      if (sortedDates.includes(dateStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  }

  function getCompletionRate(habitId: string): number {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return 0;

    const habitRecords = records.get(habitId) || [];
    const last30Days: string[] = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayOfWeek = date.getDay();

      if (habit.target_days.includes(dayOfWeek)) {
        last30Days.push(date.toISOString().split('T')[0]);
      }
    }

    if (last30Days.length === 0) return 0;

    const completedDays = habitRecords.filter(r => r.completed && last30Days.includes(r.date)).length;
    return Math.round((completedDays / last30Days.length) * 100);
  }

  async function handleCheckIn(habitId: string) {
    const today = getTodayStr();
    const existingRecords = records.get(habitId) || [];
    const existing = existingRecords.find(r => r.date === today);

    if (existing) {
      // 取消打卡
      if (existing.id) {
        await deleteHabitRecord(existing.id);
        records.set(habitId, existingRecords.filter(r => r.id !== existing.id));
      }
    } else {
      // 打卡
      const newRecord: HabitRecord = {
        id: crypto.randomUUID(),
        habit_id: habitId,
        date: today,
        completed: true,
        created_at: new Date().toISOString(),
      };
      await saveHabitRecord(newRecord);
      records.set(habitId, [...existingRecords, newRecord]);
    }
    records = records;
  }

  function openAddForm() {
    editingHabit = null;
    formName = '';
    formDescription = '';
    formIcon = '✅';
    formColor = '#667eea';
    formFrequency = 'daily';
    formTargetDays = [0, 1, 2, 3, 4, 5, 6];
    showForm = true;
  }

  function openEditForm(habit: Habit) {
    editingHabit = habit;
    formName = habit.name;
    formDescription = habit.description || '';
    formIcon = habit.icon;
    formColor = habit.color;
    formFrequency = habit.frequency;
    formTargetDays = [...habit.target_days];
    showForm = true;
  }

  function closeForm() {
    showForm = false;
    editingHabit = null;
  }

  function toggleTargetDay(day: number) {
    if (formTargetDays.includes(day)) {
      formTargetDays = formTargetDays.filter(d => d !== day);
    } else {
      formTargetDays = [...formTargetDays, day].sort();
    }
  }

  async function handleSave() {
    if (!formName.trim()) {
      error = '请输入习惯名称';
      return;
    }

    const habit: Habit = {
      id: editingHabit?.id || crypto.randomUUID(),
      name: formName.trim(),
      description: formDescription.trim() || undefined,
      icon: formIcon,
      color: formColor,
      frequency: formFrequency,
      target_days: formTargetDays,
      created_at: editingHabit?.created_at || new Date().toISOString(),
      is_active: true,
    };

    try {
      const response = await saveHabit(habit);
      if (response.success) {
        closeForm();
        await loadData();
      } else {
        error = response.error || '保存失败';
      }
    } catch (e) {
      error = `保存失败: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  async function handleDelete(habitId: string) {
    if (!confirm('确定要删除这个习惯吗？所有打卡记录也会被删除。')) return;

    try {
      const response = await deleteHabit(habitId);
      if (response.success) {
        await loadData();
      } else {
        error = response.error || '删除失败';
      }
    } catch (e) {
      error = `删除失败: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
</script>

<div class="habit-tracker">
  <div class="tracker-header">
    <h2>习惯追踪</h2>
    <button class="btn-add" on:click={openAddForm}>+ 新建习惯</button>
  </div>

  {#if error}
    <div class="error-message">{error}</div>
  {/if}

  {#if isLoading}
    <div class="loading">加载中...</div>
  {:else if habits.length === 0}
    <div class="empty-state">
      <p>还没有习惯，点击上方按钮创建一个吧！</p>
    </div>
  {:else}
    <div class="habits-grid">
      {#each habits as habit (habit.id)}
        <div class="habit-card" style="--habit-color: {habit.color}">
          <div class="habit-header">
            <span class="habit-icon">{habit.icon}</span>
            <div class="habit-info">
              <h3>{habit.name}</h3>
              {#if habit.description}
                <p class="habit-desc">{habit.description}</p>
              {/if}
            </div>
            <div class="habit-actions">
              <button class="btn-icon" on:click={() => openEditForm(habit)} title="编辑" aria-label="编辑">✏️</button>
              <button class="btn-icon" on:click={() => handleDelete(habit.id)} title="删除" aria-label="删除">🗑️</button>
            </div>
          </div>

          <div class="habit-stats">
            <div class="stat">
              <span class="stat-value">{getStreak(habit.id)}</span>
              <span class="stat-label">连续天数</span>
            </div>
            <div class="stat">
              <span class="stat-value">{getCompletionRate(habit.id)}%</span>
              <span class="stat-label">完成率</span>
            </div>
          </div>

          <div class="habit-days">
            {#each dayNames as dayName, i}
              <span class="day-tag" class:active={habit.target_days.includes(i)}>
                {dayName}
              </span>
            {/each}
          </div>

          <button
            class="btn-checkin"
            class:checked={isCheckedToday(habit.id)}
            on:click={() => handleCheckIn(habit.id)}
          >
            {isCheckedToday(habit.id) ? '✓ 已打卡' : '打卡'}
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>

{#if showForm}
  <div class="modal-overlay" role="presentation" on:click={closeForm} on:keydown={(e) => e.key === 'Escape' && closeForm()} tabindex="-1">
    <div class="modal" role="dialog" on:click|stopPropagation on:keydown|stopPropagation>
      <h3>{editingHabit ? '编辑习惯' : '新建习惯'}</h3>

      <div class="form-group">
        <label>名称 *</label>
        <input type="text" bind:value={formName} placeholder="例如：每天运动" />
      </div>

      <div class="form-group">
        <label>描述</label>
        <input type="text" bind:value={formDescription} placeholder="可选描述" />
      </div>

      <div class="form-group">
        <label>图标</label>
        <div class="icon-picker">
          {#each iconOptions as icon}
            <button
              class="icon-btn"
              class:selected={formIcon === icon}
              on:click={() => formIcon = icon}
            >
              {icon}
            </button>
          {/each}
        </div>
      </div>

      <div class="form-group">
        <label>颜色</label>
        <div class="color-picker">
          {#each colorOptions as color}
            <button
              class="color-btn"
              class:selected={formColor === color}
              style="background-color: {color}"
              on:click={() => formColor = color}
            ></button>
          {/each}
        </div>
      </div>

      <div class="form-group">
        <label>频率</label>
        <select bind:value={formFrequency}>
          <option value="daily">每天</option>
          <option value="weekly">每周</option>
        </select>
      </div>

      <div class="form-group">
        <label>目标日</label>
        <div class="day-picker">
          {#each dayNames as dayName, i}
            <button
              class="day-btn"
              class:selected={formTargetDays.includes(i)}
              on:click={() => toggleTargetDay(i)}
            >
              {dayName}
            </button>
          {/each}
        </div>
      </div>

      <div class="form-actions">
        <button class="btn-cancel" on:click={closeForm}>取消</button>
        <button class="btn-save" on:click={handleSave}>保存</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .habit-tracker {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .tracker-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .tracker-header h2 {
    margin: 0;
    font-size: 24px;
    color: #333;
  }

  .btn-add {
    padding: 10px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    transition: transform 0.2s;
  }

  .btn-add:hover {
    transform: scale(1.05);
  }

  .error-message {
    background: #fee;
    color: #c00;
    padding: 10px 16px;
    border-radius: 8px;
    margin-bottom: 16px;
  }

  .loading, .empty-state {
    text-align: center;
    padding: 40px;
    color: #666;
  }

  .habits-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }

  .habit-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border-left: 4px solid var(--habit-color, #667eea);
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .habit-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .habit-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 16px;
  }

  .habit-icon {
    font-size: 32px;
    line-height: 1;
  }

  .habit-info {
    flex: 1;
  }

  .habit-info h3 {
    margin: 0 0 4px;
    font-size: 18px;
    color: #333;
  }

  .habit-desc {
    margin: 0;
    font-size: 13px;
    color: #888;
  }

  .habit-actions {
    display: flex;
    gap: 4px;
  }

  .btn-icon {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 16px;
    padding: 4px;
    border-radius: 4px;
    transition: background 0.2s;
  }

  .btn-icon:hover {
    background: #f0f0f0;
  }

  .habit-stats {
    display: flex;
    gap: 24px;
    margin-bottom: 16px;
  }

  .stat {
    display: flex;
    flex-direction: column;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 700;
    color: var(--habit-color, #667eea);
  }

  .stat-label {
    font-size: 12px;
    color: #888;
  }

  .habit-days {
    display: flex;
    gap: 6px;
    margin-bottom: 16px;
  }

  .day-tag {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 12px;
    background: #f0f0f0;
    color: #999;
  }

  .day-tag.active {
    background: var(--habit-color, #667eea);
    color: white;
  }

  .btn-checkin {
    width: 100%;
    padding: 12px;
    border: 2px solid var(--habit-color, #667eea);
    background: white;
    color: var(--habit-color, #667eea);
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-checkin:hover {
    background: var(--habit-color, #667eea);
    color: white;
  }

  .btn-checkin.checked {
    background: var(--habit-color, #667eea);
    color: white;
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: white;
    border-radius: 16px;
    padding: 24px;
    width: 90%;
    max-width: 480px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal h3 {
    margin: 0 0 20px;
    font-size: 20px;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-group label {
    display: block;
    margin-bottom: 6px;
    font-size: 14px;
    font-weight: 500;
    color: #555;
  }

  .form-group input,
  .form-group select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
    box-sizing: border-box;
  }

  .icon-picker, .color-picker, .day-picker {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .icon-btn {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #eee;
    border-radius: 8px;
    background: white;
    font-size: 20px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .icon-btn.selected {
    border-color: #667eea;
    background: #f0f4ff;
  }

  .color-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 3px solid transparent;
    cursor: pointer;
    transition: all 0.2s;
  }

  .color-btn.selected {
    border-color: #333;
    transform: scale(1.1);
  }

  .day-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #eee;
    border-radius: 50%;
    background: white;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .day-btn.selected {
    border-color: #667eea;
    background: #667eea;
    color: white;
  }

  .form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 24px;
  }

  .btn-cancel, .btn-save {
    padding: 10px 24px;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-cancel {
    background: #f0f0f0;
    border: none;
    color: #666;
  }

  .btn-cancel:hover {
    background: #e0e0e0;
  }

  .btn-save {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    color: white;
  }

  .btn-save:hover {
    transform: scale(1.05);
  }
</style>
