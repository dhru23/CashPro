import os

def save_files_to_txt(base_dir, output_file, file_list):
    with open(output_file, "w", encoding="utf-8") as outfile:
        for file_path in file_list:
            full_path = os.path.join(base_dir, file_path)
            if os.path.exists(full_path):
                outfile.write(f"===== {file_path} =====\n\n")
                with open(full_path, "r", encoding="utf-8") as infile:
                    outfile.write(infile.read() + "\n\n")
            else:
                outfile.write(f"===== {file_path} (NOT FOUND) =====\n\n")

base_directory = "eRupeeWallet"
output_file = "sample.txt"

file_paths = [
    "client/public/index.html",
    "client/public/style.css",
    "client/src/App.css",
    "client/src/App.js",
    "client/src/index.js",
    "client/src/script.js",
    "client/src/components/Login.js",
    "client/src/components/Register.js",
    "client/src/components/Wallet.js",
    "server/.env",
    "server/blockchain.js",
    "server/package-lock.json",
    "server/package.json",
    "server/server.js",
    "server/middleware/auth.js",
    "server/models/Token.js",
    "server/models/Transaction.js",
    "server/models/User.js",
    "server/routes/auth.js"
]

save_files_to_txt(base_directory, output_file, file_paths)
print(f"All specified files have been saved in {output_file}")
