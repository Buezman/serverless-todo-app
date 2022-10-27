import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { getTodosForUser as getTodosForUser } from '../../businessLogic/todos'
import { getUserId } from '../utils';

// TODO: Get all TODO items for a current user
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Write your code here
    const userId = getUserId(event)
    let nextKey: any // Next key to continue scan operation if necessary
    let limit: number // Maximum number of elements to return
    let sort: string
    try {
      // Parse query parameters
      nextKey = parseNextKeyParameter(event)
      limit = parseLimitParameter(event) || 5
      sort = parseSortParameter(event) || 'createdAt'
    } catch (e) {
      console.log('Failed to parse query parameters: ', e.message)
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Invalid parameters'
        })
      }
    }
    const result = await getTodosForUser(userId, limit, nextKey, sort)

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        items: result.Items,
        nextKey: encodeNextKey(result.LastEvaluatedKey)
      })
    }
  }
)

handler.use(
  cors({
    credentials: true
  })
)

function parseLimitParameter(event: APIGatewayProxyEvent) {
  const limitStr = getQueryParameter(event, 'limit')
  if (!limitStr) {
    return undefined
  }

  const limit = parseInt(limitStr, 10)
  if (limit <= 0) {
    throw new Error('Limit should be positive')
  }

  return limit
}

function parseSortParameter(event: APIGatewayProxyEvent) {
  const sortParam = getQueryParameter(event, 'sort')
  if (!sortParam) return undefined

  return sortParam
}

function parseNextKeyParameter(event: APIGatewayProxyEvent) {
  const nextKeyStr = getQueryParameter(event, 'nextKey')
  if (!nextKeyStr) {
    return undefined
  }

  const uriDecoded = decodeURIComponent(nextKeyStr)
  return JSON.parse(uriDecoded)
}

function getQueryParameter(event: { queryStringParameters: any }, name: string) {
  const queryParams = event.queryStringParameters
  if (!queryParams) {
    return undefined
  }

  return queryParams[name]
}

function encodeNextKey(lastEvaluatedKey: any) {
  if (!lastEvaluatedKey) {
    return null
  }

  return encodeURIComponent(JSON.stringify(lastEvaluatedKey))
}