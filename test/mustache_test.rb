# mustache.js runs ruby tests, sorta
# run with mustache_test.rb testname

require 'json'

def run_test_for(testname, with_jquery = false)
  puts "doing #{testname}"

  view = File.read("examples/#{testname}.js")
  template = File.read("examples/#{testname}.html").to_json
  expect = File.read("examples/#{testname}.txt")

  if with_jquery
    puts "with jquery"
    jquery   = File.read("vendor/jquery-1.3.2.ALTERED.js")
    mustache = File.read("jquery.mustache.js")
    runner = <<-JS
    Element = function(name) {
      this.name = name;
    };
    document = {documentElement: {}, createElement: function() {}}; 
    navigator = {userAgent: "spidermonkey"};
    form = new Element();
    #{jquery}
    #{mustache}
    #{view}
    var template = #{template};
    var result = $.mustache(template, #{testname});
    print(result);
    JS
  else
    mustache = File.read("mustache.js")
    runner = <<-JS
    #{mustache}
    #{view}
    var template = #{template};
    var result = Mustache.to_html(template, #{testname});
    print(result);
    JS
  end
  
  File.open("runner.js", 'w') {|f| f << runner}

  result = `js runner.js`

  if(result == expect)
    puts "OK"
  else
    puts "Error in #{testname}"
    puts "Expected"
    puts "'#{expect}'"
    puts "Actual"
    puts "'#{result}'"
  end
end

if testname = ARGV.shift
  run_test_for(testname)
else
  puts "running all tests"
  Dir['examples/*.js'].each do |example|
    testname = File.basename(example, '.js')
    run_test_for(testname)
    run_test_for(testname, true)
  end
end
