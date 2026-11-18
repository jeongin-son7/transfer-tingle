-- 비전문가용 선수 설명: players에 포지션/한 줄 특징 컬럼 추가.
--
-- 둘 다 nullable — 확실히 아는 선수만 값을 채우고, 자신 없는 선수는 null로
-- 남겨서 화면에서 그냥 안 보이게 한다(추측해서 채우지 않음). 기존 players
-- 행에 컬럼만 추가하는 거라 재실행해도 안전(add column if not exists).

alter table players add column if not exists position text;
alter table players add column if not exists trait text;

-- 아래 update들은 이름으로 특정 행만 골라 고정된 값을 다시 쓰는 것이라
-- 여러 번 실행해도 결과가 같다(idempotent). "루카 부슈코비치"처럼 포지션을
-- 확실히 모르는 선수는 아래 목록에서 제외해서 null로 남긴다.

update players set position = '공격수', trait = '양발을 다 쓰고 골 결정력이 좋은 공격수' where name = '오마르 마르무시';
update players set position = '윙어', trait = '드리블과 돌파가 강점인 윙어' where name = '사비뉴';
update players set position = '윙어', trait = '스피드와 드리블이 강점인 왼쪽 윙어' where name = '미하일로 무드릭';
update players set position = '공격수', trait = '왼쪽에서 중앙으로 들어오는 움직임이 좋은 공격수' where name = '코디 가크포';
update players set position = '스트라이커', trait = '골문 앞 마무리가 좋은 스트라이커' where name = '곤살로 라모스';
update players set position = '센터백', trait = '빌드업 능력이 좋은 왼발 센터백' where name = '니코 슐로터베크';
update players set position = '윙어', trait = '스피드와 드리블이 뛰어난 왼쪽 윙어' where name = '라파엘 레앙';
update players set position = '공격형 미드필더', trait = '패스와 득점 가담이 많은 공격형 미드필더' where name = '브루누 페르난데스';
update players set position = '공격형 미드필더', trait = '드리블과 슈팅이 좋은 공격형 미드필더' where name = '콜 파머';

update players set position = '공격수', trait = '왼발 슈팅과 침투가 강점인 공격수' where name = '손흥민';
update players set position = '공격형 미드필더', trait = '세트피스와 패스가 좋은 공격형 미드필더' where name = '제임스 매디슨';
update players set position = '공격수', trait = '오른쪽에서 중앙으로 들어오는 움직임이 좋은 공격수' where name = '데얀 쿨루셉스키';
update players set position = '센터백', trait = '거친 수비와 투지가 강점인 센터백' where name = '크리스티안 로메로';
update players set position = '스트라이커', trait = '골문 앞 마무리 능력이 뛰어난 스트라이커' where name = '엘링 홀란드';
update players set position = '공격형 미드필더', trait = '드리블과 중거리 슈팅이 좋은 공격형 미드필더' where name = '필 포든';
update players set position = '수비형 미드필더', trait = '경기 조율 능력이 뛰어난 수비형 미드필더' where name = '로드리';
update players set position = '수비형 미드필더', trait = '수비 커버와 경험이 풍부한 수비형 미드필더' where name = '카제미루';
update players set position = '윙어', trait = '골 결정력이 뛰어난 오른쪽 윙어' where name = '모하메드 살라';
update players set position = '센터백', trait = '제공권과 리더십이 강점인 센터백' where name = '버질 반다이크';
update players set position = '골키퍼', trait = '선방 능력과 발밑 기술이 좋은 골키퍼' where name = '알리송 베케르';
update players set position = '공격형 미드필더', trait = '창의적인 패스와 드리블이 강점인 공격형 미드필더' where name = '플로리안 비르츠';
update players set position = '중앙 미드필더', trait = '패스 범위가 넓은 중앙 미드필더' where name = '엔소 페르난데스';
update players set position = '윙어', trait = '드리블과 크로스가 좋은 오른쪽 윙어' where name = '부카요 사카';
update players set position = '공격형 미드필더', trait = '경기 조율과 패스가 뛰어난 공격형 미드필더' where name = '마르틴 외데고르';
update players set position = '미드필더', trait = '수비 커버와 활동량이 좋은 미드필더' where name = '데클란 라이스';
update players set position = '센터백', trait = '스피드와 수비 범위가 좋은 센터백' where name = '윌리암 살리바';
update players set position = '센터백', trait = '공중볼 경합과 투지가 강점인 센터백' where name = '가브리엘 마갈량이스';
update players set position = '스트라이커', trait = '연계 플레이가 좋은 스트라이커' where name = '가브리엘 제주스';
update players set position = '센터백', trait = '빌드업 능력이 좋은 센터백' where name = '니클라스 쥐레';
update players set position = '스트라이커', trait = '활동량이 많고 침투가 좋은 스트라이커' where name = '올리 왓킨스';
update players set position = '공격수', trait = '스피드와 골 결정력이 뛰어난 공격수' where name = '킬리안 음바페';
update players set position = '윙어', trait = '드리블과 스피드가 강점인 왼쪽 윙어' where name = '비니시우스 주니오르';
update players set position = '미드필더', trait = '박스 침투와 득점 가담이 많은 미드필더' where name = '주드 벨링엄';
update players set position = '골키퍼', trait = '큰 체격과 반응속도가 강점인 골키퍼' where name = '티보 쿠르투아';
update players set position = '중앙 미드필더', trait = '활동량과 중거리 슈팅이 강점인 미드필더' where name = '페데리코 발베르데';
update players set position = '윙어', trait = '드리블과 창의성이 돋보이는 오른쪽 윙어' where name = '라민 야말';
update players set position = '중앙 미드필더', trait = '볼 터치와 경기 조율이 뛰어난 미드필더' where name = '페드리';
update players set position = '스트라이커', trait = '골문 앞 위치선정이 뛰어난 스트라이커' where name = '로베르트 레반도프스키';
update players set position = '중앙 미드필더', trait = '패스와 득점 가담이 좋은 미드필더' where name = '파비안 루이스';
update players set position = '공격수', trait = '연계 플레이와 창의성이 강점인 공격수' where name = '안토안 그리즈만';
update players set position = '스트라이커', trait = '활동량이 많고 다재다능한 공격수' where name = '훌리안 알바레스';
update players set position = '스트라이커', trait = '피지컬과 골 결정력이 강점인 스트라이커' where name = '두산 블라호비치';
update players set position = '윙어', trait = '스피드와 드리블이 강점인 윙어' where name = '마르쿠스 튀랑';
update players set position = '골키퍼', trait = '발밑 기술과 선방 능력이 좋은 골키퍼' where name = '마이크 메이냥';
update players set position = '스트라이커', trait = '골 결정력이 뛰어난 스트라이커' where name = '라우타로 마르티네스';
update players set position = '중앙 미드필더', trait = '활동량과 패스가 좋은 중앙 미드필더' where name = '니콜로 바렐라';
update players set position = '스트라이커', trait = '골 결정력과 연계 플레이를 모두 갖춘 스트라이커' where name = '해리 케인';
update players set position = '공격형 미드필더', trait = '드리블과 창의성이 돋보이는 공격형 미드필더' where name = '자말 무시알라';
update players set position = '미드필더', trait = '패스 범위가 넓고 다재다능한 미드필더' where name = '조슈아 키미히';
update players set position = '중앙 미드필더', trait = '피지컬과 득점 가담이 좋은 미드필더' where name = '레온 고레츠카';
update players set position = '윙어', trait = '스피드가 강점인 윙어' where name = '카림 아데예미';
update players set position = '윙어', trait = '드리블과 스피드가 강점인 오른쪽 윙어' where name = '우스만 뎀벨레';
update players set position = '중앙 미드필더', trait = '볼 소유와 경기 조율이 좋은 미드필더' where name = '비티냐';
update players set position = '윙어', trait = '드리블 돌파가 강점인 왼쪽 윙어' where name = '크비차 크바라츠헬리아';

-- 무산 이적설 3건(supabase/seed_failed_transfers.sql)의 선수들도 포지션이
-- 널리 알려진 선수라 함께 채운다.
update players set position = '스트라이커', trait = '스피드와 피지컬을 갖춘 스트라이커' where name = '빅터 오시멘';
update players set position = '윙어', trait = '드리블과 왼발 슈팅이 좋은 윙어' where name = '제이든 산초';
update players set position = '스트라이커', trait = '피지컬과 골 결정력이 강점인 스트라이커' where name = '로멜루 루카쿠';

-- "루카 부슈코비치"는 포지션을 확실히 확인하지 못해 일부러 비워둔다(null).
