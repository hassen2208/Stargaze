import os

import firebase_admin

from firebase_admin import credentials


firebase_path = os.getenv(
    "FIREBASE_CREDENTIALS_PATH"
)

if not firebase_admin._apps:

    cred = credentials.Certificate(
        firebase_path
    )

    firebase_admin.initialize_app(
        cred
    )