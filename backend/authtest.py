from auth import hash_password, verify_password

hashed = hash_password("mypassword")
print("Hashed:", hashed)

print("Check correct:", verify_password("mypassword", hashed))
print("Check wrong:", verify_password("wrongpass", hashed))
