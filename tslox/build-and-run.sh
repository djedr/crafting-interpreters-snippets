for f in ./*.cpp.ts; do
  # -x assembler-with-cpp is to suppress "warning: missing terminating ' character"
  # -traditional-cpp is to preserve spaces in debug output
  cpp -P -undef -Wundef -std=c99 -x assembler-with-cpp -nostdinc -Wtrigraphs -fdollars-in-identifiers -traditional-cpp -C "$f" > "${f%.cpp.ts}.ts"
done
tsc --project tsconfig.actual.json && node out/main.js
