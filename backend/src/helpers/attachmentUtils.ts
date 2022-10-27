import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

// TODO: Implement the fileStorage logic

const XAWS = AWSXRay.captureAWS(AWS)
export class AttachmentUtils {
    constructor (
        private readonly s3 = new XAWS.S3({signatureVersion: 'v4'}),
        private readonly docClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly s3Bucket = process.env.ATTACHMENT_S3_BUCKET,
        private readonly todosTable = process.env.TODOS_TABLE,
        private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION){
    }

    async deleteTodoImage(todoId: string){
        this.s3.deleteObject({
            Bucket: this.s3Bucket,
            Key: todoId
        });
    }

    async generateUploadUrl(todoId:string, userId: string) {
        const bucketName = this.s3Bucket;
        const imageUrl = `https://${bucketName}.s3.amazonaws.com/${todoId}`;
        await this.docClient.update({
            TableName: this.todosTable,
            Key: {
                todoId,
                userId
            },
            UpdateExpression: 'set attachmentUrl = :attachmentUrl',
            ExpressionAttributeValues: {
                ':attachmentUrl': imageUrl
            }
        }).promise()

        return this.s3.getSignedUrl('putObject',{
            Bucket: this.s3Bucket,
            Key: todoId,
            Expires: parseInt(this.urlExpiration),
        })
    }
}


