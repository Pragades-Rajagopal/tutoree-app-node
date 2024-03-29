CREATE VIEW IF NOT EXISTS student_info_vw 
AS
SELECT
	DISTINCT 
	U.ID ,
	U.FIRST_NAME || ' ' || U.LAST_NAME AS name,
	U.EMAIL,
	GROUP_CONCAT((
	SELECT
		GROUP_CONCAT(C.NAME,
		', ')
	FROM
		COURSES C
	WHERE
		C.ID = S.COURSE_ID), ', ') AS interests
FROM
	STUDENTS S ,
	USERS U,
	COURSES C
WHERE
	U.ID = S.STUDENT_ID
	AND U."_STATUS" = 1
GROUP BY
	U.ID,
	NAME,
	EMAIL
;


CREATE VIEW IF NOT EXISTS tutor_info_vw
AS
SELECT
	DISTINCT 
	U.ID ,
	U.FIRST_NAME || ' ' || U.LAST_NAME AS name,
	U.EMAIL,
	T.MAIL_SUBSCRIPTION,
	T.BIO,
	T.WEBSITES,
	GROUP_CONCAT((
	SELECT
		GROUP_CONCAT(C.NAME,
		', ')
	FROM
		COURSES C
	WHERE
		C.ID = T.COURSE_ID), ', ') AS interests
FROM
	TUTORS T ,
	USERS U,
	COURSES C
WHERE
	U.ID = T.TUTOR_ID
	AND U."_STATUS" = 1
GROUP BY
	U.ID,
	NAME,
	EMAIL
;

CREATE VIEW IF NOT EXISTS tutor_view_requests_vw
AS
SELECT
	DISTINCT TR.TUTOR_ID,
	U.ID student_id,
	U.FIRST_NAME || ' ' || U.LAST_NAME AS name,
	U.EMAIL,
	U.MOBILE_NO,
	GROUP_CONCAT((
	SELECT
		GROUP_CONCAT(C.NAME,
		', ')
	FROM
		COURSES C
	WHERE
		C.ID = S.COURSE_ID),
	', ') AS interests,
	TR.tutor_req_hide,
	TR.student_req_hide
FROM
	TUTOR_REQUESTS TR,
	STUDENTS S,
	USERS U
WHERE
	S.STUDENT_ID = TR.STUDENT_ID
	AND U.ID = S.STUDENT_ID
GROUP BY
	U.ID,
	NAME,
	U.EMAIL,
	U.MOBILE_NO,
	TR.TUTOR_ID 
;