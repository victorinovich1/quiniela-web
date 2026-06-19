-- =====================================================
-- 072 - Vistas de Resultados Oficiales del Mundial
-- =====================================================

-- ===== OFFICIAL_GROUP_STANDINGS =====
-- Calcula posiciones de grupos basándose en resultados reales de matches
-- Usa getMatchScores para incluir partidos en vivo

drop view if exists public.official_group_standings cascade;

create or replace view public.official_group_standings
with (security_invoker = true)
as
select
  t.id as team_id,
  t.name as team_name,
  t.group_code,
  t.iso_code,
  count(case when m.id is not null then 1 end) as pj,
  count(case 
    when m.home_team_id = t.id and (
      case 
        when m.status = 'finished' then m.home_score
        when m.status = 'live' and m.home_score is not null then m.home_score
        when m.status = 'scheduled' and m.kickoff_at is not null 
          and m.kickoff_at <= now() and m.home_score is not null then m.home_score
        else null
      end
    ) > (
      case 
        when m.status = 'finished' then m.away_score
        when m.status = 'live' and m.away_score is not null then m.away_score
        when m.status = 'scheduled' and m.kickoff_at is not null 
          and m.kickoff_at <= now() and m.away_score is not null then m.away_score
        else null
      end
    ) then 1
    when m.away_team_id = t.id and (
      case 
        when m.status = 'finished' then m.away_score
        when m.status = 'live' and m.away_score is not null then m.away_score
        when m.status = 'scheduled' and m.kickoff_at is not null 
          and m.kickoff_at <= now() and m.away_score is not null then m.away_score
        else null
      end
    ) > (
      case 
        when m.status = 'finished' then m.home_score
        when m.status = 'live' and m.home_score is not null then m.home_score
        when m.status = 'scheduled' and m.kickoff_at is not null 
          and m.kickoff_at <= now() and m.home_score is not null then m.home_score
        else null
      end
    ) then 1
  end) as pg,
  count(case 
    when (m.home_team_id = t.id or m.away_team_id = t.id) and (
      case 
        when m.status = 'finished' then m.home_score
        when m.status = 'live' and m.home_score is not null then m.home_score
        when m.status = 'scheduled' and m.kickoff_at is not null 
          and m.kickoff_at <= now() and m.home_score is not null then m.home_score
        else null
      end
    ) = (
      case 
        when m.status = 'finished' then m.away_score
        when m.status = 'live' and m.away_score is not null then m.away_score
        when m.status = 'scheduled' and m.kickoff_at is not null 
          and m.kickoff_at <= now() and m.away_score is not null then m.away_score
        else null
      end
    ) then 1
  end) as pe,
  count(case 
    when m.home_team_id = t.id and (
      case 
        when m.status = 'finished' then m.home_score
        when m.status = 'live' and m.home_score is not null then m.home_score
        when m.status = 'scheduled' and m.kickoff_at is not null 
          and m.kickoff_at <= now() and m.home_score is not null then m.home_score
        else null
      end
    ) < (
      case 
        when m.status = 'finished' then m.away_score
        when m.status = 'live' and m.away_score is not null then m.away_score
        when m.status = 'scheduled' and m.kickoff_at is not null 
          and m.kickoff_at <= now() and m.away_score is not null then m.away_score
        else null
      end
    ) then 1
    when m.away_team_id = t.id and (
      case 
        when m.status = 'finished' then m.away_score
        when m.status = 'live' and m.away_score is not null then m.away_score
        when m.status = 'scheduled' and m.kickoff_at is not null 
          and m.kickoff_at <= now() and m.away_score is not null then m.away_score
        else null
      end
    ) < (
      case 
        when m.status = 'finished' then m.home_score
        when m.status = 'live' and m.home_score is not null then m.home_score
        when m.status = 'scheduled' and m.kickoff_at is not null 
          and m.kickoff_at <= now() and m.home_score is not null then m.home_score
        else null
      end
    ) then 1
  end) as pp,
  coalesce(sum(case 
    when m.home_team_id = t.id then (
      case 
        when m.status = 'finished' then m.home_score
        when m.status = 'live' and m.home_score is not null then m.home_score
        when m.status = 'scheduled' and m.kickoff_at is not null 
          and m.kickoff_at <= now() and m.home_score is not null then m.home_score
        else 0
      end
    )
    when m.away_team_id = t.id then (
      case 
        when m.status = 'finished' then m.away_score
        when m.status = 'live' and m.away_score is not null then m.away_score
        when m.status = 'scheduled' and m.kickoff_at is not null 
          and m.kickoff_at <= now() and m.away_score is not null then m.away_score
        else 0
      end
    )
    else 0
  end), 0) as gf,
  coalesce(sum(case 
    when m.home_team_id = t.id then (
      case 
        when m.status = 'finished' then m.away_score
        when m.status = 'live' and m.away_score is not null then m.away_score
        when m.status = 'scheduled' and m.kickoff_at is not null 
          and m.kickoff_at <= now() and m.away_score is not null then m.away_score
        else 0
      end
    )
    when m.away_team_id = t.id then (
      case 
        when m.status = 'finished' then m.home_score
        when m.status = 'live' and m.home_score is not null then m.home_score
        when m.status = 'scheduled' and m.kickoff_at is not null 
          and m.kickoff_at <= now() and m.home_score is not null then m.home_score
        else 0
      end
    )
    else 0
  end), 0) as gc,
  (
    coalesce(sum(case 
      when m.home_team_id = t.id then (
        case 
          when m.status = 'finished' then m.home_score
          when m.status = 'live' and m.home_score is not null then m.home_score
          when m.status = 'scheduled' and m.kickoff_at is not null 
            and m.kickoff_at <= now() and m.home_score is not null then m.home_score
          else 0
        end
      )
      when m.away_team_id = t.id then (
        case 
          when m.status = 'finished' then m.away_score
          when m.status = 'live' and m.away_score is not null then m.away_score
          when m.status = 'scheduled' and m.kickoff_at is not null 
            and m.kickoff_at <= now() and m.away_score is not null then m.away_score
          else 0
        end
      )
      else 0
    end), 0) -
    coalesce(sum(case 
      when m.home_team_id = t.id then (
        case 
          when m.status = 'finished' then m.away_score
          when m.status = 'live' and m.away_score is not null then m.away_score
          when m.status = 'scheduled' and m.kickoff_at is not null 
            and m.kickoff_at <= now() and m.away_score is not null then m.away_score
          else 0
        end
      )
      when m.away_team_id = t.id then (
        case 
          when m.status = 'finished' then m.home_score
          when m.status = 'live' and m.home_score is not null then m.home_score
          when m.status = 'scheduled' and m.kickoff_at is not null 
            and m.kickoff_at <= now() and m.home_score is not null then m.home_score
          else 0
        end
      )
      else 0
    end), 0)
  ) as dg,
  (
    count(case 
      when m.home_team_id = t.id and (
        case 
          when m.status = 'finished' then m.home_score
          when m.status = 'live' and m.home_score is not null then m.home_score
          when m.status = 'scheduled' and m.kickoff_at is not null 
            and m.kickoff_at <= now() and m.home_score is not null then m.home_score
          else null
        end
      ) > (
        case 
          when m.status = 'finished' then m.away_score
          when m.status = 'live' and m.away_score is not null then m.away_score
          when m.status = 'scheduled' and m.kickoff_at is not null 
            and m.kickoff_at <= now() and m.away_score is not null then m.away_score
          else null
        end
      ) then 1
      when m.away_team_id = t.id and (
        case 
          when m.status = 'finished' then m.away_score
          when m.status = 'live' and m.away_score is not null then m.away_score
          when m.status = 'scheduled' and m.kickoff_at is not null 
            and m.kickoff_at <= now() and m.away_score is not null then m.away_score
          else null
        end
      ) > (
        case 
          when m.status = 'finished' then m.home_score
          when m.status = 'live' and m.home_score is not null then m.home_score
          when m.status = 'scheduled' and m.kickoff_at is not null 
            and m.kickoff_at <= now() and m.home_score is not null then m.home_score
          else null
        end
      ) then 1
    end) * 3 +
    count(case 
      when (m.home_team_id = t.id or m.away_team_id = t.id) and (
        case 
          when m.status = 'finished' then m.home_score
          when m.status = 'live' and m.home_score is not null then m.home_score
          when m.status = 'scheduled' and m.kickoff_at is not null 
            and m.kickoff_at <= now() and m.home_score is not null then m.home_score
          else null
        end
      ) = (
        case 
          when m.status = 'finished' then m.away_score
          when m.status = 'live' and m.away_score is not null then m.away_score
          when m.status = 'scheduled' and m.kickoff_at is not null 
            and m.kickoff_at <= now() and m.away_score is not null then m.away_score
          else null
        end
      ) then 1
    end)
  ) as pts
from public.teams t
left join public.matches m on (
  m.phase = 'group' 
  and m.group_code = t.group_code
  and (m.home_team_id = t.id or m.away_team_id = t.id)
)
where t.group_code is not null
group by t.id, t.name, t.group_code, t.iso_code
order by t.group_code, pts desc, dg desc, gf desc, t.name;

grant select on public.official_group_standings to authenticated, anon;

-- ===== OFFICIAL_BEST_THIRDS =====
-- Ranking de terceros lugares para clasificación a R32

drop view if exists public.official_best_thirds cascade;

create or replace view public.official_best_thirds
with (security_invoker = true)
as
with group_positions as (
  select
    *,
    row_number() over (partition by group_code order by pts desc, dg desc, gf desc, team_name) as position
  from public.official_group_standings
)
select
  team_id,
  team_name,
  group_code,
  iso_code,
  pj,
  pg,
  pe,
  pp,
  gf,
  gc,
  dg,
  pts,
  row_number() over (order by pts desc, dg desc, gf desc, team_name) as third_place_rank
from group_positions
where position = 3
order by pts desc, dg desc, gf desc, team_name;

grant select on public.official_best_thirds to authenticated, anon;

-- LOG: Confirmar cambios
do $$
begin
  raise notice '✅ Vistas de resultados oficiales creadas:';
  raise notice '   - official_group_standings (posiciones de grupos)';
  raise notice '   - official_best_thirds (ranking de terceros)';
end $$;
