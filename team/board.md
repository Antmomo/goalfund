# بروتوكول اللوحة (مختصر)

- تبدأ مهمة: حالتك «يشتغل» + اسم المهمة + جملة قصيرة.
- تحتاج المالك: حالتك «ينتظرك» + بطاقة في needs.
- تنتظر قسم ثاني: حالتك «ينتظر قسم» + اسم القسم.
- توقفت: حالتك «متوقف» + حدث stuck.
- خلصت: أضف التسليم في recent + حدث report للمدير + حالتك «فاضي».
- اقرأ الملف قبل ما تكتب، واكتب برقم إصداره (if_version) عشان ما تمسح شغل غيرك.
- الأوقات دايماً بنظام 12 ساعة (مثلاً 9:30 م).
- لو فشلت الكتابة في اللوحة، كمّل الشغل واذكرها في تقريرك.

## مكان اللوحة
- الرابط: https://claude.ai/artifact/Gs9HFwYd9GaDq1ax4Zp2XZ (خاصة بالمالك)
- البيانات فيها أربع مجموعات:
  - `staff/<id>`: ‏name, role, status (يشتغل / ينتظرك / ينتظر قسم / متوقف / فاضي), task, note, waitingOn, updatedAt
    - المعرّفات: ceo, researcher, writer, editor, publisher
  - `needs/<id>`: ‏from, title, detail, status (open / decided), decision, createdAt, decidedAt — المالك يقرر من اللوحة نفسها.
  - `recent/<id>`: ‏from, title, path, at
  - `events/<id>`: ‏type (report / stuck), from, text, at
- الأوقات تنحفظ بصيغة ISO وتنعرض بنظام 12 ساعة.
