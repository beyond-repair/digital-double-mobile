from jwt import decode, DecodeError
import os


def validate_token(token):
    try:
        decoded = decode(token, os.getenv('JWT_SECRET'), algorithms=['HS256'])
        return decoded
    except DecodeError:
        return None