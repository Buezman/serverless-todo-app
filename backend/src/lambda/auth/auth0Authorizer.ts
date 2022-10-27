import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
// import Axios from 'axios'
// import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
// const jwksUrl = 'https://dev-mzihvychkpb7eqvp.us.auth0.com/.well-known/jwks.json'
const cert = `-----BEGIN CERTIFICATE-----
MIIDHTCCAgWgAwIBAgIJeVXTaAIvBkm0MA0GCSqGSIb3DQEBCwUAMCwxKjAoBgNV
BAMTIWRldi1temlodnljaGtwYjdlcXZwLnVzLmF1dGgwLmNvbTAeFw0yMjEwMjQy
MDEzMTJaFw0zNjA3MDIyMDEzMTJaMCwxKjAoBgNVBAMTIWRldi1temlodnljaGtw
YjdlcXZwLnVzLmF1dGgwLmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoC
ggEBAPHhq3/f0siQ5QuguUUSlETYOocXmMaSwMGAe5cbNiVSmaC0fGQE7mUicsqU
G6Yj/LhNj0RkNn2oRmX2glG1H2IIijAvDkNhC1Cj2c6XBZypQVBg99uDbl786zfa
16KDKpRBRHK079pNnSqMNjg/zDgzhrQx/Z5ZWC82yOP/oA1cNmJOMAqOU12ZfEna
RCQ13mQfVLnA8noNV/+U7bNvdsFYCLqLjlL9NcWKw4u7G5hiTpxM9alDyHq++13w
4wxQYCVbTmxuyfFwo2+FUc3Am/BdL3pjvZkWpg8KTAn4ewyzXtYIVAmyC1y0oIcq
abSOa2VkhDtQX2qj9rF+pjRyZp0CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAd
BgNVHQ4EFgQU6RVrBtv7oX4Dzc2dGNVadH/nmAQwDgYDVR0PAQH/BAQDAgKEMA0G
CSqGSIb3DQEBCwUAA4IBAQCiJu+kmlnJLjUfZFSA5dceLc6UJJFQ7JWPQoYp9nlz
ZJoobJaRC8C7tTSkN8fod2BQfP1+T3ZIdbu8REu3JnyrKlCugM3WiIRqL8AcqvAH
zkAlDaWGd8T04859pBne+cZlTxnVhNN/hHzBVbef0RGsNfeHkShpBUazzvPh0Zap
7V1yO0o7+ef6QsCLglRA4rPYH1eM8JVr7noOsOpnMxWZluhxElMUZcoM3ja+KJGc
DG3ROpRM50nyvNb28c5nS+RUKDThSlrkD9lBL5awavaLwyrGh8Ji52wcz7+/21tQ
iomxuG3MgskIDD7x+AVEoU7MDMWVsA2144yyD7GeANlw
-----END CERTIFICATE-----`

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  // const jwt: Jwt = decode(token, { complete: true }) as Jwt

  // TODO: Implement token verification
  // You should implement it similarly to how it was implemented for the exercise for the lesson 5
  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/
  
  return verify(token, cert, { algorithms: ['RS256']}) as JwtPayload;
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}
