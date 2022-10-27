import { TodosAccess } from './todosAcess'
import { AttachmentUtils } from './attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
// import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
// import * as createError from 'http-errors'

// TODO: Implement businessLogic

const todosAccess = new TodosAccess()
const attachmentUtils = new AttachmentUtils()

export async function createTodo(request: CreateTodoRequest, userId: string) : Promise<TodoItem> {
    const todoId = uuid.v4()
    // const attachmentUrl = await createAttachmentPresignedUrl(todoId)
    const todo = {
        userId,
        todoId,
        createdAt: new Date().toISOString(),
        name: request.name,
        dueDate: request.dueDate,
        done: false,
    }
    return await todosAccess.createTodo(todo)
}

export async function updateTodo(request:UpdateTodoRequest, todoId:string, userId: string) {
    return await todosAccess.updateTodo(request, todoId, userId)
}

export async function deleteTodo(todoId: string, userId: string) {
    await attachmentUtils.deleteTodoImage(todoId)
    return await todosAccess.deleteTodo(todoId, userId)
}

export async function getTodosForUser(userId: string) : Promise<TodoItem[]> {
    return await todosAccess.getUserTodos(userId)
}

export async function createAttachmentPresignedUrl(todoId:string, userId:string) {
    return await attachmentUtils.generateUploadUrl(todoId,userId)   
}