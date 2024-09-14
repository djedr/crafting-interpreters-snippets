for f in ./*.cpp.ts; do
  cpp -P -undef -Wundef -std=c99 -nostdinc -Wtrigraphs -fdollars-in-identifiers -C "$f" > "${f%.cpp.ts}.ts"
done
tsc --project tsconfig.actual.json && node out/main.js
