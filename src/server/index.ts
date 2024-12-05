import express from 'express';
import cors from 'cors';
import prisma from '../lib/prisma';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Middleware to verify authentication
const authenticateUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  const userId = authHeader.split(' ')[1];
  if (!userId) {
    return res.status(401).json({ error: 'Invalid authorization header' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// Get all todos for the authenticated user
app.get('/api/todos', authenticateUser, async (req: express.Request, res: express.Response) => {
  try {
    const todos = await prisma.todo.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching todos' });
  }
});

// Create a todo for the authenticated user
app.post('/api/todos', authenticateUser, async (req: express.Request, res: express.Response) => {
  try {
    const { text } = req.body;
    const todo = await prisma.todo.create({
      data: {
        text,
        userId: req.user.id
      },
    });
    res.json(todo);
  } catch (error) {
    res.status(500).json({ error: 'Error creating todo' });
  }
});

// Update a todo
app.put('/api/todos/:id', authenticateUser, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const { completed } = req.body;
    
    const todo = await prisma.todo.findUnique({
      where: { id: Number(id) }
    });

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    if (todo.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this todo' });
    }

    const updatedTodo = await prisma.todo.update({
      where: { id: Number(id) },
      data: { completed },
    });
    res.json(updatedTodo);
  } catch (error) {
    res.status(500).json({ error: 'Error updating todo' });
  }
});

// Delete a todo
app.delete('/api/todos/:id', authenticateUser, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    
    const todo = await prisma.todo.findUnique({
      where: { id: Number(id) }
    });

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    if (todo.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this todo' });
    }

    await prisma.todo.delete({
      where: { id: Number(id) },
    });
    res.json({ message: 'Todo deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting todo' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
