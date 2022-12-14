import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic
export class TodosAccess {
    constructor (
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly createdAtIndex = process.env.TODOS_CREATED_AT_INDEX,
        private readonly dueDateIndex = process.env.TODOS_DUE_DATE_INDEX,
        private readonly todosTable = process.env.TODOS_TABLE) {
    }

    async createTodo(todo: TodoItem): Promise<TodoItem> {
        logger.info('Creating new todo')
        await this.docClient.put({
            TableName: this.todosTable,
            Item: todo
        }).promise()

        return todo;
    }

    async getUserTodos(userId:string, limit: number, nextKey: any, sort?: string) {
        logger.info(`Getting all todos for user with id: ${userId}`)
        const result = await this.docClient.query({
            TableName: this.todosTable,
            KeyConditionExpression: 'userId = :userId',
            IndexName: sort == 'dueDate' ? this.dueDateIndex : this.createdAtIndex,
            ExpressionAttributeValues: {
            ':userId': userId
            },
            ScanIndexForward: sort == 'dueDate' ? true : false,
            Limit: limit,
            ExclusiveStartKey: nextKey
        }).promise()

        // const userTodos = result.Items
        return result
    }

    async updateTodo(updateRequest: TodoUpdate, todoId:string, userId:string) {
        logger.info(`Updating todo with id: ${todoId}`)
        const isValidTodo = await this.todoExists(todoId, userId)
        if (!isValidTodo) {
            return {
              statusCode: 404,
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true
              },
              body: JSON.stringify({
                error: 'Todo does not exist'
              })
            }
        }
        await this.docClient.update({
            TableName: this.todosTable,
            Key: {
                'todoId': todoId,
                'userId': userId
            },
            UpdateExpression: 'set #name = :name, dueDate = :dueDate, done = :done',
            ExpressionAttributeValues: {
                ':name': updateRequest.name,
                ':dueDate': updateRequest.dueDate,
                ':done': updateRequest.done
            },
            ExpressionAttributeNames: {
                '#name': 'name'
            }
        }).promise()
    }

    async deleteTodo(todoId:string, userId:string) {
        logger.info(`Deleting todo with id: ${todoId}`)

        return await this.docClient.delete({
            TableName: this.todosTable,
            Key: {
                todoId,
                userId
            }
        }).promise()
    }

    async todoExists(todoId: string, userId:string) {
        const result = await this.docClient.get({
            TableName: this.todosTable,
            Key: {
                todoId,
                userId
            }
        }).promise()
        logger.info('Get todoId', result)
        return !!result.Item
    }
}

