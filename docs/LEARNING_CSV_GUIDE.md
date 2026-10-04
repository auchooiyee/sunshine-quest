# 教师 CSV 学习报告

版本 0.4.0。报告描述学生在本地游戏中的当前练习记录，不转换为 PBD 等级、章节掌握度或 SPM 成绩。

## 导出

1. 打开 **Learning journal / Jurnal pembelajaran**。
2. 可填写 **Learner code / Kod murid**，例如教师分配的 `CYE007`。该代码由玩家填写，最多 40 字符，不涉及账号验证。
3. 点击 **Export learning CSV / Eksport CSV pembelajaran**。自由冒险下载 `mathwithcye-expedition-learning.csv`，课堂任务下载 `mathwithcye-class-learning.csv`。
4. 在 Excel 等表格工具中打开。文件为带 BOM 的 UTF-8，以保留 BM 文字；按逗号分隔，文本使用引号保护。

自由冒险每个已访问区域导出六行，已访问的综合关导出五行。课堂任务只导出其配置的三/六个章节检查或五个综合关检查。未完成的题目也保留一行。未访问区域不出现在报告中。

JSON 导出仍用于恢复游戏存档，CSV 用于查看与整理学习记录。

## 主要字段

| 字段 | 含义 |
|---|---|
| `learner_code` | 可选的玩家填写代码，可为空 |
| `exported_at_utc` | 本次报告导出时间，ISO 格式 UTC |
| `mode` / `mission_code` | 自由冒险或课堂任务；课堂码可辨认其配置 |
| `region_id` / `chapter` | 区域与章节；综合关列出 1、6、7、9、10 |
| `question_set` | `original-v1`、`practice-b-v1` 或 `practice-c-v1` |
| `task_id` / `task_title_en` / `task_title_ms` | 当前题组中的检查标识与双语标题 |
| `status` | 未开始、进行中、独立首答完成或有支持完成，见下表 |
| `completed` | 经过当前数学模型验证的完成状态 |
| `attempts` | 有效数学提交次数；缺字段或格式无效的提交不计入 |
| `hints_used` | 已显示的提示数，0–3；引导任务自动显示首提示 |
| `independent_first_answer` | 首次有效提交正确且没有使用提示时为 `true` |
| `xp` | 当前检查已经获得的冒险 XP；未完成为 0 |
| `answer_draft` | 当前答案或草稿，以 JSON 文本保存 |
| `last_attempt_at_utc` | 最近有效尝试时间；无记录时为空 |

| `status` 值 | 解读 |
|---|---|
| `not_started` | 没有草稿、提示或有效提交 |
| `in_progress` | 已有操作记录，尚未完成 |
| `completed_independent` | 首次有效提交正确，无提示 |
| `completed_supported` | 完成时使用过提示或重试 |

引导练习的完成应显示为 `completed_supported`。独立完成的 XP 与有支持完成的 XP 相同，应结合提示和尝试次数解读。

尝试次数来自每题累计状态；时间列来自最多 100 条最近有效尝试记录，较早题目的时间可能为空。记录与界面一样使用本机时间。

## 比较不同练习

教师先指定章节、题组与支持模式，再收集 CSV。使用 `learner_code`、`mission_code`、`question_set`、`task_id` 和导出时间辨认同一学生的不同练习，避免把同一次练习的重复导出当成新增成果。

**Try another question set** 会替换当前区域的题组和证据，**Restart** 会清空当前题组的进度。希望比较前后表现时，先导出旧报告，再进行新练习。其他区域不会因此清空；旧报告文件不会由游戏删除。

报告保存于学生设备，由教师收集。游戏不自动汇总班级、不验证学生身份，也不上传记录。
