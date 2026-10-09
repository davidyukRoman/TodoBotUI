import { useEffect, useState } from 'react';

// УВАГА: Тут має бути публічне посилання на ваш локальний C# бекенд!
// Для тестування запустіть у терміналі: ngrok http 5255 (ваш порт бекенду)
// і вставте сюди https адресу від ngrok.
const API_BASE_URL = 'https://davidyuk-todo.duckdns.org/api/tasks';

interface Task {
  id: string;
  title: string;
  isCompleted: boolean;
}

function App() {
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      if (tg.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user);
        // Як тільки дізналися ID користувача - завантажуємо його завдання
        fetchTasks(tg.initDataUnsafe.user.id);
      } else {
        setLoading(false);
      }
    }
  }, []);

  // Отримання списку завдань
  const fetchTasks = async (userId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (e) {
      console.error("Помилка завантаження", e);
    } finally {
      setLoading(false);
    }
  };

  // Зміна статусу
  const toggleTask = async (taskId: string) => {
    // Оптимістичне оновлення UI (щоб не чекати відповіді сервера)
    setTasks(tasks.map(t => t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t));
    
    try {
      await fetch(`${API_BASE_URL}/${taskId}/toggle`, { method: 'PUT' });
    } catch (e) {
      // Якщо помилка - перезавантажуємо справжній стан з бази
      if (user) fetchTasks(user.id); 
    }
  };

  // Видалення
  const deleteTask = async (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
    
    try {
      await fetch(`${API_BASE_URL}/${taskId}`, { method: 'DELETE' });
    } catch (e) {
      if (user) fetchTasks(user.id);
    }
  };

  return (
    <div style={{ padding: '20px', color: 'var(--tg-theme-text-color, #ffffff)', backgroundColor: 'var(--tg-theme-bg-color, #121212)', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      <h2 style={{ marginTop: 0 }}>Мої завдання</h2>
      
      {loading ? (
        <p>Завантаження...</p>
      ) : tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>
          <span style={{ fontSize: '40px' }}>📭</span>
          <p>У вас немає активних завдань</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {tasks.map(task => (
            <div key={task.id} style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
              padding: '15px', backgroundColor: 'var(--tg-theme-secondary-bg-color, #1c1c1e)', 
              borderRadius: '12px', transition: '0.2s'
            }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, cursor: 'pointer' }} onClick={() => toggleTask(task.id)}>
                {/* Чекбокс */}
                <div style={{ 
                  width: '24px', height: '24px', borderRadius: '50%', 
                  border: task.isCompleted ? 'none' : '2px solid #84cc16', 
                  backgroundColor: task.isCompleted ? '#84cc16' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {task.isCompleted && <span style={{ color: '#050505', fontSize: '14px', fontWeight: 'bold' }}>✓</span>}
                </div>
                
                {/* Текст завдання */}
                <span style={{ 
                  fontSize: '16px', 
                  textDecoration: task.isCompleted ? 'line-through' : 'none',
                  opacity: task.isCompleted ? 0.5 : 1
                }}>
                  {task.title}
                </span>
              </div>

              {/* Кнопка видалення */}
              <button 
                onClick={() => deleteTask(task.id)}
                style={{ 
                  background: 'none', border: 'none', color: '#ef4444', 
                  fontSize: '18px', cursor: 'pointer', padding: '5px' 
                }}
              >
                🗑
              </button>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;