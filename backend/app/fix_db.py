"""修复数据库默认值并创建索引"""

from app.db.session import engine
from sqlalchemy import text


def main():
    with engine.connect() as conn:
        # 临时清除 sql_mode 限制
        conn.execute(text("SET SESSION sql_mode = ''"))

        # 修复所有表的 created_at 和 updated_at 默认值
        tables_with_timestamps = [
            "users", "categories", "threads", "posts",
            "tags", "likes", "favorites", "notifications",
        ]
        for table in tables_with_timestamps:
            try:
                conn.execute(text(
                    f"ALTER TABLE {table} MODIFY COLUMN created_at "
                    "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP"
                ))
                print(f"  修复 {table}.created_at")
            except Exception as e:
                print(f"  跳过 {table}.created_at: {str(e)[:60]}")

            try:
                conn.execute(text(
                    f"ALTER TABLE {table} MODIFY COLUMN updated_at "
                    "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP "
                    "ON UPDATE CURRENT_TIMESTAMP"
                ))
                print(f"  修复 {table}.updated_at")
            except Exception:
                # 部分表可能没有 updated_at 字段
                pass

        # 创建复合索引
        indexes = [
            ("threads", "ix_threads_type_deleted_category",
             "type, is_deleted, category_id"),
            ("threads", "ix_threads_type_deleted_user",
             "type, is_deleted, user_id"),
            ("threads", "ix_threads_deleted_category",
             "is_deleted, category_id"),
            ("posts", "ix_posts_thread_deleted_floor",
             "thread_id, is_deleted, floor"),
        ]
        for table, index_name, columns in indexes:
            try:
                conn.execute(text(
                    f"CREATE INDEX {index_name} ON {table} ({columns})"
                ))
                print(f"  创建索引 {index_name}")
            except Exception as e:
                if "Duplicate" in str(e):
                    print(f"  索引已存在 {index_name}")
                else:
                    print(f"  创建索引失败 {index_name}: {str(e)[:60]}")

        conn.commit()
    print("完成")


if __name__ == "__main__":
    main()
