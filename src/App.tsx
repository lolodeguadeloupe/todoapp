import React, { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

const API_URL = 'http://localhost:3001/api';

function App() {
  const { data: session } = useSession();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchTodos();
    }
  }, [session]);

  const fetchTodos = async () => {
    try {
      const response = await fetch(`${API_URL}/todos`, {
        headers: {
          'Authorization': `Bearer ${session?.user?.id}`
        }
      });
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setTodos(data);
      } else {
        console.error('Received invalid data format from API:', data);
        setTodos([]);
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
      setTodos([]);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    
    if (input.trim() !== '') {
      try {
        const response = await fetch(`${API_URL}/todos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.user.id}`
          },
          body: JSON.stringify({ text: input.trim() }),
        });
        const newTodo = await response.json();
        setTodos(prevTodos => [newTodo, ...prevTodos]);
        setInput('');
      } catch (error) {
        console.error('Error adding todo:', error);
      }
    }
  };

  const toggleTodo = async (id: number) => {
    if (!session) return;
    
    try {
      const todo = todos.find(t => t.id === id);
      const response = await fetch(`${API_URL}/todos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.user.id}`
        },
        body: JSON.stringify({ completed: !todo?.completed }),
      });
      const updatedTodo = await response.json();
      setTodos(todos.map(todo =>
        todo.id === id ? updatedTodo : todo
      ));
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const deleteTodo = async (id: number) => {
    if (!session) return;
    
    try {
      await fetch(`${API_URL}/todos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.user.id}`
        }
      });
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">Welcome to Todo App</h1>
          <button
            onClick={() => signIn()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <div className="flex justify-between items-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-800">Todo List</h1>
                  <button
                    onClick={() => signOut()}
                    className="text-red-500 hover:text-red-700"
                  >
                    Sign out
                  </button>
                </div>
                
                <form onSubmit={addTodo} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="Add a new todo..."
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none"
                  >
                    Add
                  </button>
                </form>

                <div className="space-y-4">
                  {todos.map(todo => (
                    <div
                      key={todo.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={() => toggleTodo(todo.id)}
                          className="h-4 w-4 text-blue-500"
                        />
                        <span
                          className={`ml-3 ${
                            todo.completed ? 'line-through text-gray-400' : 'text-gray-700'
                          }`}
                        >
                          {todo.text}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
