import { TodosAccess } from './todosAcess'
import { AttachmentUtils } from './attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
import createError from 'http-errors';

// TODO: Implement businessLogic

const logger = createLogger('Todos')
const todosAccess = new TodosAccess()
const attachmentUtils = new AttachmentUtils()

export async function createTodo(request: CreateTodoRequest, userId: string) : Promise<TodoItem> {
    logger.info('Creating new todo')
    
    try{
        const todoId = uuid.v4()
        const todo = {
            userId,
            todoId,
            createdAt: new Date().toISOString(),
            name: request.name,
            dueDate: request.dueDate,
            done: false,
            attachmentUrl: ""
        }
        return await todosAccess.createTodo(todo)
    } catch(e) {
        createError(e.message)
    }
    
}

export async function updateTodo(request:UpdateTodoRequest, todoId:string, userId: string) {
    logger.info('Updating todo with id: ',todoId)
    try {
        return await todosAccess.updateTodo(request, todoId, userId)
    } catch(e) {
        createError(e.message)
    }
}

export async function deleteTodo(todoId: string, userId: string) {
    logger.info('Deleting todo with id: ',todoId)
    try {
        await attachmentUtils.deleteTodoImage(todoId)
        return await todosAccess.deleteTodo(todoId, userId)    
    } catch(e) {
        createError(e.message)
    }
}

export async function getTodosForUser(userId: string, limit: number, nextKey:any, sort?: string) {
    logger.info('Getting todos for userId: ',userId)
    try {
        return await todosAccess.getUserTodos(userId, limit, nextKey, sort)
    } catch(e) {
        createError(e.message)
    }
}

export async function createAttachmentPresignedUrl(todoId:string, userId:string) {
    logger.info('Generating upload url for todoId: ',todoId)
    try {
        return await attachmentUtils.generateUploadUrl(todoId,userId)           
    } catch (e) {
        createError(e.message)
    }
}