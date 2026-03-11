from config.database import get_connection


class UserModel:

    @staticmethod
    def add(table, data):
        try:
            conn = get_connection()
            cursor = conn.cursor()
            allowed_tables = ["users","income_wallet",'messages',"status"]
            if table not in allowed_tables:
                raise ValueError("Invalid table name")
            fields = ", ".join(data.keys())
            placeholders = ", ".join(["%s"] * len(data))
            values = tuple(data.values())
            query = f"INSERT INTO {table} ({fields}) VALUES ({placeholders})"
            cursor.execute(query, values)
            conn.commit()

            return True

        except Exception as e:
            conn.rollback()
            print("Error:", e)
            return False

        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def all_records(table,where,select):
        try:
            conn = get_connection()
            cursor = conn.cursor(dictionary=True)

            allowed_tables = ["users","income_wallet",'messages',"status"]
            if table not in allowed_tables:
                raise ValueError("Invalid table name")
            if where != '':
                query = f"SELECT {select} FROM {table} WHERE {where}"
            else:
                query = f"SELECT {select} FROM {table}"
        
            cursor.execute(query)
            data = cursor.fetchall()

            return data

        except Exception as e:
            print("Error:", e)
            return []

        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def build_where_clause(where_dict):
        clauses = []
        values = []

        for key, value in where_dict.items():
            clauses.append(f"{key} = %s")
            values.append(value)

        where_clause = " AND ".join(clauses)
        return where_clause, tuple(values)

    @staticmethod
    def get_single_record(table, where_dict=None, select="*"):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        try:
            query = f"SELECT {select} FROM {table}"
            params = ()

            if where_dict:
                where_clause, params = UserModel.build_where_clause(where_dict)
                query += f" WHERE {where_clause}"

            query += " LIMIT 1"

            cursor.execute(query, params)
            data = cursor.fetchone()
            return data

        finally:
            cursor.close()
            conn.close()
            
    @staticmethod
    def paginated_records(table, select, search, limit, offset, Orderby="ASC"):
        try:
            conn = get_connection()
            cursor = conn.cursor(dictionary=True)
            allowed_tables = ["users"]
            if table not in allowed_tables:
                raise ValueError("Invalid table")
            cursor.execute(f"SHOW COLUMNS FROM {table}")
            columns_data = cursor.fetchall()
            columns = [col['Field'] for col in columns_data]
            where_clause = ""
            values = []
            if search:
                like_conditions = []
                for col in columns:
                    like_conditions.append(f"{col} LIKE %s")
                    values.append(f"%{search}%")
                where_clause = "WHERE " + " OR ".join(like_conditions)
            count_query = f"SELECT COUNT(*) as total FROM {table} {where_clause}"
            cursor.execute(count_query, values)
            total = cursor.fetchone()["total"]
            query = f"""
                SELECT {select}
                FROM {table}
                {where_clause}
                ORDER BY id {Orderby}
                LIMIT %s OFFSET %s
            """
            cursor.execute(query, values + [limit, offset])
            data = cursor.fetchall()
            return data, total

        except Exception as e:
            print("Error:", e)
            return [], 0

        finally:
            cursor.close()
            conn.close()
            
    @staticmethod
    def update_record(table, where, data):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        set_clause = ", ".join([f"{k}=%s" for k in data.keys()])
        condition = " AND ".join([f"{k}=%s" for k in where.keys()])
        sql = f"UPDATE {table} SET {set_clause} WHERE {condition}"
        values = list(data.values()) + list(where.values())
        cursor.execute(sql, values)
        conn.commit()
        cursor.close()
        conn.close()
        return True 

