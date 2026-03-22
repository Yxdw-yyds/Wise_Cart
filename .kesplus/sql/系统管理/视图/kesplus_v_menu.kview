-- "kesplus_base"."kesplus_v_menu" source

CREATE OR REPLACE VIEW "kesplus_base"."kesplus_v_menu"
AS SELECT kam.id,
    kam.parent_id AS parentId,
    kam.title AS name,
    kamm.title AS parentName,
    kam.code,
    kam.icon,
    NVL(int4(kam.enabled), 1) AS enabled,
    kam.hidden_flag AS hiddenFlag,
    kam.outer_link AS outerLink,
    kam.classify,
    kam.tenant_id AS tenantId,
    kam.component,
    kam.url,
    kam.module_id AS moduleId,
    kam.obj_type AS objType,
    kk.module_code AS moduleCode,
    kk.module_path AS modulePath,
    kk.sort AS moduleSort,
    NVL(kk.sort, 1) * -1000 + nvl(kam."sort_num", 1) AS "sortNum"
   FROM kesplus_base.kesplus_base_menu kam
     JOIN kesplus_app.kesplus_module kk ON kam.module_id::text = kk.id::text
     LEFT JOIN kesplus_base.kesplus_base_menu kamm ON kam.parent_id::text = kamm.id::text;