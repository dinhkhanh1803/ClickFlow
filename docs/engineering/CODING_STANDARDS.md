# Coding Standards

TypeScript strict, không dùng `any` trừ ngoại lệ được giải thích. Dùng PascalCase cho type/component, camelCase cho value/function, kebab-case cho file; module có API rõ và import sắp xếp nhất quán. Validate input, handle error có ngữ cảnh, log không nhạy cảm; comment giải thích quyết định thay vì lặp code. PR nhỏ, có review checklist; production build không được có warning/error, test liên quan phải pass.
